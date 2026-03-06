import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.SUPABASE_URL || '';
const supabaseServiceKey = process.env.SUPABASE_SERVICE_KEY || '';

export const supabase = createClient(supabaseUrl, supabaseServiceKey);

const BUCKET = 'agent-media';

export interface UploadResult {
    url: string;
    type: 'image' | 'video';
    path: string;
}

/**
 * Upload a file to Supabase Storage.
 * Returns the public URL and media type.
 */
export async function uploadMedia(
    file: Buffer,
    filename: string,
    contentType: string,
): Promise<UploadResult> {
    const ext = filename.split('.').pop()?.toLowerCase() || 'bin';
    const isVideo = ['mp4', 'mov', 'webm', 'avi'].includes(ext);
    const type = isVideo ? 'video' : 'image';

    const path = `${type}s/${Date.now()}_${filename}`;

    const { error } = await supabase.storage
        .from(BUCKET)
        .upload(path, file, {
            contentType,
            upsert: false,
        });

    if (error) {
        throw new Error(`Storage upload failed: ${error.message}`);
    }

    const { data: urlData } = supabase.storage
        .from(BUCKET)
        .getPublicUrl(path);

    return {
        url: urlData.publicUrl,
        type,
        path,
    };
}

/**
 * Delete a file from Supabase Storage.
 */
export async function deleteMedia(path: string): Promise<void> {
    const { error } = await supabase.storage
        .from(BUCKET)
        .remove([path]);

    if (error) {
        throw new Error(`Storage delete failed: ${error.message}`);
    }
}
