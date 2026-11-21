import crypto from 'node:crypto';
import { z } from 'zod';

export const VALID_THEMES = [
  'obsidian-gold',
  'nordic-paper',
  'cyber-emerald',
  'sunset-terracotta',
  'deep-cobalt'
];

// Strip ASCII control characters & zero-width obfuscation characters
export function sanitizeText(value) {
  if (typeof value !== 'string') return '';
  return value
    .replace(/[\u0000-\u001F\u007F-\u009F\u200B-\u200D\uFEFF]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

const cleanString = (min, max) =>
  z.preprocess(
    (val) => sanitizeText(val),
    z.string().min(min).max(max)
  );

export const MilestoneSchema = z.object({
  id: z.string().regex(/^[a-zA-Z0-9_-]{1,24}$/).optional(),
  label: cleanString(1, 46),
  dueOffsetLabel: cleanString(1, 18),
  done: z.boolean().default(false)
});

export const GeneratePlanSchema = z.object({
  title: cleanString(2, 60),
  targetIso: z.string().refine((val) => !Number.isNaN(Date.parse(val)), {
    message: 'Invalid ISO date string'
  }),
  context: z.preprocess(
    (val) => sanitizeText(val ?? ''),
    z.string().max(260)
  ).default('')
});

export const SaveDesignSchema = z.object({
  title: cleanString(2, 60),
  mantra: z.preprocess(
    (val) => sanitizeText(val ?? ''),
    z.string().max(80)
  ).default('Execute daily. Protect the deadline.'),
  targetIso: z.string().refine((val) => !Number.isNaN(Date.parse(val)), {
    message: 'Invalid ISO date string'
  }),
  deviceType: z.enum(['mobile', 'desktop']),
  themeId: z.enum(VALID_THEMES),
  milestones: z.array(MilestoneSchema).min(1).max(6)
});

export const UpdateMilestonesSchema = z.object({
  milestones: z.array(MilestoneSchema).min(1).max(6)
});

export const SlugParamSchema = z.string().regex(/^[A-Za-z0-9_-]{12,32}$/);

export function generateCredentials() {
  const slug = crypto.randomBytes(12).toString('base64url'); // 16-char URL-safe slug
  const editToken = crypto.randomBytes(32).toString('hex');  // 64-char secret owner token
  const editTokenHash = hashToken(editToken);
  return { slug, editToken, editTokenHash };
}

export function hashToken(token) {
  return crypto.createHash('sha256').update(String(token)).digest('hex');
}

export function verifyEditToken(providedToken, storedHashHex) {
  if (typeof providedToken !== 'string' || !/^[a-f0-9]{64}$/i.test(providedToken)) {
    return false;
  }
  const providedBuf = Buffer.from(hashToken(providedToken), 'hex');
  const storedBuf = Buffer.from(storedHashHex, 'hex');
  if (providedBuf.length !== storedBuf.length) return false;
  return crypto.timingSafeEqual(providedBuf, storedBuf);
}
