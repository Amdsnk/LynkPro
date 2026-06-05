import { createClient } from 'jsr:@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const url = new URL(req.url);
    const shareToken = url.searchParams.get('token');

    if (!shareToken) {
      throw new Error('Share token required');
    }

    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    // Get share details
    const { data: share, error: shareError } = await supabaseClient
      .from('file_shares')
      .select('*')
      .eq('share_token', shareToken)
      .single();

    if (shareError) throw new Error('Share not found');

    // Check expiration
    if (share.expires_at && new Date(share.expires_at) < new Date()) {
      throw new Error('Share link expired');
    }

    // Get file IDs
    let fileIds: string[] = [];
    if (share.is_bulk) {
      const { data: items, error: itemsError } = await supabaseClient
        .from('file_share_items')
        .select('file_id')
        .eq('share_id', share.id);

      if (itemsError) throw itemsError;
      fileIds = items.map(item => item.file_id);
    } else {
      fileIds = [share.file_id];
    }

    // Get file details
    const { data: files, error: filesError } = await supabaseClient
      .from('files')
      .select('*')
      .in('id', fileIds);

    if (filesError) throw filesError;

    // For single file, return direct download
    if (files.length === 1) {
      const file = files[0];
      const { data: fileData, error: downloadError } = await supabaseClient.storage
        .from('project-files')
        .download(file.file_path);

      if (downloadError) throw downloadError;

      return new Response(fileData, {
        headers: {
          ...corsHeaders,
          'Content-Type': file.file_type,
          'Content-Disposition': `attachment; filename="${file.name}"`,
        },
      });
    }

    // For multiple files, create ZIP
    // Note: Deno doesn't have built-in ZIP support, so we'll use JSZip from npm
    const JSZip = (await import('npm:jszip@3.10.1')).default;
    const zip = new JSZip();

    // Download and add each file to ZIP
    for (const file of files) {
      try {
        const { data: fileData, error: downloadError } = await supabaseClient.storage
          .from('project-files')
          .download(file.file_path);

        if (downloadError) {
          console.error(`Error downloading file ${file.name}:`, downloadError);
          continue;
        }

        zip.file(file.name, fileData);
      } catch (error) {
        console.error(`Error adding file ${file.name} to ZIP:`, error);
      }
    }

    // Generate ZIP
    const zipBlob = await zip.generateAsync({ type: 'uint8array' });

    return new Response(zipBlob, {
      headers: {
        ...corsHeaders,
        'Content-Type': 'application/zip',
        'Content-Disposition': 'attachment; filename="shared-files.zip"',
      },
    });
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
