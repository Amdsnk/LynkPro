import { createClient } from "jsr:@supabase/supabase-js@2";
import { authenticator } from "npm:otplib@12.0.1";

const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const supabase = createClient(supabaseUrl, supabaseKey);

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

function ok(data: unknown): Response {
  return new Response(
    JSON.stringify({ code: "SUCCESS", message: "Success", data }),
    {
      status: 200,
      headers: {
        "Content-Type": "application/json",
        ...corsHeaders
      }
    }
  );
}

function fail(msg: string, code = 400): Response {
  return new Response(
    JSON.stringify({ code: "FAIL", message: msg }),
    {
      status: code,
      headers: {
        "Content-Type": "application/json",
        ...corsHeaders
      }
    }
  );
}

async function verifyTOTP(userId: string, token: string): Promise<boolean> {
  // Get user's TOTP secret
  const { data: totpSecret, error } = await supabase
    .from('totp_secrets')
    .select('secret, is_enabled')
    .eq('user_id', userId)
    .eq('is_enabled', true)
    .single();

  if (error || !totpSecret) {
    return false;
  }

  // Verify TOTP token
  try {
    const isValid = authenticator.verify({
      token: token,
      secret: totpSecret.secret,
    });
    return isValid;
  } catch (error) {
    console.error('TOTP verification error:', error);
    return false;
  }
}

async function verifyRecoveryCode(userId: string, code: string): Promise<boolean> {
  // Find unused recovery code
  const { data: recoveryCode, error } = await supabase
    .from('recovery_codes')
    .select('id, code, is_used')
    .eq('user_id', userId)
    .eq('code', code)
    .eq('is_used', false)
    .single();

  if (error || !recoveryCode) {
    return false;
  }

  // Mark recovery code as used
  const { error: updateError } = await supabase
    .from('recovery_codes')
    .update({
      is_used: true,
      used_at: new Date().toISOString(),
    })
    .eq('id', recoveryCode.id);

  if (updateError) {
    console.error('Failed to mark recovery code as used:', updateError);
    return false;
  }

  return true;
}

Deno.serve(async (req) => {
  try {
    if (req.method === "OPTIONS") {
      return new Response(null, { headers: corsHeaders });
    }

    if (req.method !== "POST") {
      return new Response("Method not allowed", { status: 405 });
    }

    const { userId, token, type } = await req.json();

    if (!userId || !token) {
      throw new Error("Missing required parameters: userId and token");
    }

    // Check rate limit (5 attempts per minute)
    const { data: rateLimitCheck, error: rateLimitError } = await supabase
      .rpc('check_rate_limit', {
        p_user_id: userId,
        p_attempt_type: '2fa_verification',
        p_max_attempts: 5,
        p_window_minutes: 1
      });

    if (rateLimitError) {
      console.error('Rate limit check error:', rateLimitError);
    }

    if (rateLimitCheck === false) {
      return new Response(
        JSON.stringify({
          code: "RATE_LIMIT_EXCEEDED",
          message: "Too many verification attempts. Please wait a minute and try again."
        }),
        {
          status: 429,
          headers: {
            "Content-Type": "application/json",
            "Retry-After": "60",
            ...corsHeaders
          }
        }
      );
    }

    // Record this attempt
    const clientIp = req.headers.get('x-forwarded-for') || req.headers.get('x-real-ip') || 'unknown';
    const userAgent = req.headers.get('user-agent') || 'unknown';
    
    await supabase.rpc('record_rate_limit_attempt', {
      p_user_id: userId,
      p_attempt_type: '2fa_verification',
      p_ip_address: clientIp,
      p_user_agent: userAgent
    });

    const verificationType = type || 'totp';
    let isValid = false;

    if (verificationType === 'totp') {
      isValid = await verifyTOTP(userId, token);
    } else if (verificationType === 'recovery') {
      isValid = await verifyRecoveryCode(userId, token);
    } else {
      throw new Error("Invalid verification type. Must be 'totp' or 'recovery'");
    }

    if (isValid) {
      return ok({
        verified: true,
        type: verificationType,
        message: verificationType === 'recovery' 
          ? 'Recovery code verified and marked as used' 
          : 'TOTP code verified successfully',
      });
    } else {
      return fail(
        verificationType === 'recovery' 
          ? 'Invalid or already used recovery code' 
          : 'Invalid TOTP code',
        401
      );
    }
  } catch (error) {
    console.error('2FA verification error:', error);
    return fail(error instanceof Error ? error.message : "Verification failed", 500);
  }
});
