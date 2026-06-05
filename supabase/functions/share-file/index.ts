import { createClient } from 'jsr:@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface ShareFileRequest {
  fileIds: string[];
  sharedWithEmail?: string;
  expiresAt?: string;
  expirationDuration?: number;
  password?: string;
  permissionLevel: 'view' | 'download';
  customMessage?: string;
  sendEmail?: boolean;
  autoRenew?: boolean;
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    const authHeader = req.headers.get('Authorization')!;
    const token = authHeader.replace('Bearer ', '');
    const { data: { user } } = await supabaseClient.auth.getUser(token);

    if (!user) {
      throw new Error('Unauthorized');
    }

    const body: ShareFileRequest = await req.json();
    const { fileIds, sharedWithEmail, expiresAt, expirationDuration, password, permissionLevel, customMessage, sendEmail, autoRenew } = body;

    if (!fileIds || fileIds.length === 0) {
      throw new Error('No files selected');
    }

    // Generate unique share token
    const shareToken = crypto.randomUUID();

    // Hash password if provided
    let passwordHash = null;
    if (password) {
      const encoder = new TextEncoder();
      const data = encoder.encode(password);
      const hashBuffer = await crypto.subtle.digest('SHA-256', data);
      const hashArray = Array.from(new Uint8Array(hashBuffer));
      passwordHash = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
    }

    const isBulk = fileIds.length > 1;

    // Create share record
    const { data: share, error: shareError } = await supabaseClient
      .from('file_shares')
      .insert({
        file_id: isBulk ? null : fileIds[0],
        share_token: shareToken,
        created_by: user.id,
        shared_with_email: sharedWithEmail,
        expires_at: expiresAt,
        expiration_duration: expirationDuration,
        password_hash: passwordHash,
        permission_level: permissionLevel,
        custom_message: customMessage,
        is_bulk: isBulk,
        auto_renew: autoRenew || false,
      })
      .select()
      .single();

    if (shareError) throw shareError;

    // Create share items for bulk shares
    if (isBulk) {
      const shareItems = fileIds.map(fileId => ({
        share_id: share.id,
        file_id: fileId,
      }));

      const { error: itemsError } = await supabaseClient
        .from('file_share_items')
        .insert(shareItems);

      if (itemsError) throw itemsError;
    }

    // Get file details
    const { data: files, error: filesError } = await supabaseClient
      .from('files')
      .select('name, project_id')
      .in('id', fileIds);

    if (filesError) throw filesError;

    // Generate share URL
    const shareUrl = `${Deno.env.get('SUPABASE_URL')?.replace('/rest/v1', '')}/share/${shareToken}`;

    // Send email if requested
    if (sendEmail && sharedWithEmail) {
      const { data: profile } = await supabaseClient
        .from('profiles')
        .select('email, phone')
        .eq('id', user.id)
        .single();

      const senderEmail = profile?.email || profile?.phone || 'someone';
      const fileNames = files.map(f => f.name).join(', ');

      console.log('Email to send:', {
        to: sharedWithEmail,
        from: senderEmail,
        subject: `${senderEmail} shared ${isBulk ? `${fileIds.length} files` : 'a file'} with you`,
        message: customMessage || `You have been granted access to: ${fileNames}`,
        shareUrl,
        expiresAt,
      });
    }

    return new Response(
      JSON.stringify({
        success: true,
        share,
        shareUrl,
        fileCount: fileIds.length,
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    );
  } catch (error) {
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400,
      }
    );
  }
});
