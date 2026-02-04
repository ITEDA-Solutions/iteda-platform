// Dryer ID Generator
// Generates unique dryer IDs in format: DRY-YYYY-###

import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

const supabase = createClient(supabaseUrl, supabaseServiceKey);

/**
 * Generate a unique dryer ID in format DRY-YYYY-###
 * Example: DRY-2026-001, DRY-2026-002, etc.
 */
export async function generateDryerId(): Promise<string> {
  const currentYear = new Date().getFullYear();
  const prefix = `DRY-${currentYear}-`;

  // Get the highest sequence number for this year
  const { data: existingDryers, error } = await supabase
    .from('dryers')
    .select('dryer_id')
    .like('dryer_id', `${prefix}%`)
    .order('dryer_id', { ascending: false })
    .limit(1);

  if (error) {
    console.error('Error fetching existing dryers:', error);
    throw new Error('Failed to generate dryer ID');
  }

  let nextSequence = 1;

  if (existingDryers && existingDryers.length > 0) {
    const lastId = existingDryers[0].dryer_id;
    const lastSequence = parseInt(lastId.split('-')[2]);
    nextSequence = lastSequence + 1;
  }

  // Format sequence with leading zeros (001, 002, etc.)
  const sequenceStr = nextSequence.toString().padStart(3, '0');
  const newDryerId = `${prefix}${sequenceStr}`;

  // Verify uniqueness (double-check)
  const { data: duplicate } = await supabase
    .from('dryers')
    .select('id')
    .eq('dryer_id', newDryerId)
    .single();

  if (duplicate) {
    // If somehow we have a duplicate, try next sequence
    return generateDryerId();
  }

  return newDryerId;
}

/**
 * Validate dryer ID format
 */
export function validateDryerId(dryerId: string): boolean {
  const pattern = /^DRY-\d{4}-\d{3}$/;
  return pattern.test(dryerId);
}

/**
 * Parse dryer ID to extract year and sequence
 */
export function parseDryerId(dryerId: string): { year: number; sequence: number } | null {
  if (!validateDryerId(dryerId)) {
    return null;
  }

  const parts = dryerId.split('-');
  return {
    year: parseInt(parts[1]),
    sequence: parseInt(parts[2]),
  };
}

/**
 * Get next available dryer ID (preview without saving)
 */
export async function previewNextDryerId(): Promise<string> {
  return generateDryerId();
}
