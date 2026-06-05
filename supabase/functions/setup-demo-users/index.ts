import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface DemoUser {
  email: string
  password: string
  full_name: string
  role: 'admin' | 'staff' | 'client'
  phone?: string
}

const demoUsers: DemoUser[] = [
  {
    email: 'admin@lynkpro.com',
    password: 'demo123',
    full_name: 'Admin User',
    role: 'admin',
    phone: '+1 (555) 100-0001',
  },
  {
    email: 'pm@lynkpro.com',
    password: 'demo123',
    full_name: 'Project Manager',
    role: 'staff',
    phone: '+1 (555) 100-0002',
  },
  {
    email: 'field@lynkpro.com',
    password: 'demo123',
    full_name: 'Field Worker',
    role: 'staff',
    phone: '+1 (555) 100-0003',
  },
  {
    email: 'safety@lynkpro.com',
    password: 'demo123',
    full_name: 'Safety Officer',
    role: 'staff',
    phone: '+1 (555) 100-0004',
  },
  {
    email: 'client@lynkpro.com',
    password: 'demo123',
    full_name: 'Client User',
    role: 'client',
    phone: '+1 (555) 100-0005',
  },
  {
    email: 'subcontractor@lynkpro.com',
    password: 'demo123',
    full_name: 'Subcontractor User',
    role: 'client',
    phone: '+1 (555) 100-0006',
  },
]

const DEMO_FIRM_ID = '00000000-0000-0000-0000-000000000001'

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    // Create Supabase Admin client
    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false,
        },
      }
    )

    const results = []
    const errors = []

    // Create each demo user
    for (const user of demoUsers) {
      try {
        // Check if user already exists
        const { data: existingUsers } = await supabaseAdmin.auth.admin.listUsers()
        const userExists = existingUsers?.users?.some((u) => u.email === user.email)

        if (userExists) {
          results.push({
            email: user.email,
            status: 'already_exists',
            message: 'User already exists',
          })
          continue
        }

        // Create user with admin API
        const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
          email: user.email,
          password: user.password,
          email_confirm: true,
          user_metadata: {
            full_name: user.full_name,
          },
        })

        if (authError) {
          errors.push({
            email: user.email,
            error: authError.message,
          })
          continue
        }

        if (!authData.user) {
          errors.push({
            email: user.email,
            error: 'User creation failed - no user data returned',
          })
          continue
        }

        // Update profile with correct role and firm_id
        const { error: profileError } = await supabaseAdmin
          .from('profiles')
          .update({
            role: user.role,
            firm_id: DEMO_FIRM_ID,
            full_name: user.full_name,
            phone: user.phone,
            is_active: true,
          })
          .eq('id', authData.user.id)

        if (profileError) {
          errors.push({
            email: user.email,
            error: `Profile update failed: ${profileError.message}`,
          })
          continue
        }

        // For portal users (client and subcontractor), create portal access
        if (user.role === 'client') {
          const portalType = user.email.includes('client') ? 'client' : 'subcontractor'
          
          // Get demo projects
          const { data: projects } = await supabaseAdmin
            .from('projects')
            .select('id')
            .eq('firm_id', DEMO_FIRM_ID)
            .limit(3)

          const projectIds = projects?.map((p) => p.id) || []

          const { error: portalError } = await supabaseAdmin
            .from('portal_access')
            .insert({
              user_id: authData.user.id,
              firm_id: DEMO_FIRM_ID,
              portal_type: portalType,
              project_ids: projectIds,
              permissions: {
                view_progress: true,
                view_financials: portalType === 'client',
                view_photos: true,
                view_reports: true,
                submit_timesheets: portalType === 'subcontractor',
                view_payments: portalType === 'subcontractor',
                view_documents: true,
                send_messages: portalType === 'subcontractor',
              },
              is_active: true,
            })

          if (portalError) {
            console.error(`Portal access creation failed for ${user.email}:`, portalError)
          }
        }

        results.push({
          email: user.email,
          status: 'created',
          role: user.role,
          user_id: authData.user.id,
        })
      } catch (error) {
        errors.push({
          email: user.email,
          error: error instanceof Error ? error.message : 'Unknown error',
        })
      }
    }

    return new Response(
      JSON.stringify({
        success: true,
        message: `Demo users setup completed. Created: ${results.filter((r) => r.status === 'created').length}, Already existed: ${results.filter((r) => r.status === 'already_exists').length}, Errors: ${errors.length}`,
        results,
        errors: errors.length > 0 ? errors : undefined,
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    )
  } catch (error) {
    console.error('Setup demo users error:', error)
    return new Response(
      JSON.stringify({
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500,
      }
    )
  }
})
