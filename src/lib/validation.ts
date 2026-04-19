import { z } from 'zod';
import { PIN_REGEX } from './security';

/** Strict, reusable Zod schemas for all sensitive flows. */
export const emailSchema = z.string().trim().toLowerCase().email('Email invalide').max(255);

export const passwordSchema = z
  .string()
  .min(8, 'Au moins 8 caractères')
  .max(100, 'Trop long')
  .regex(/[A-Z]/, 'Au moins une majuscule')
  .regex(/[a-z]/, 'Au moins une minuscule')
  .regex(/[0-9]/, 'Au moins un chiffre');

export const pinSchema = z
  .string()
  .regex(PIN_REGEX, 'Le PIN doit contenir exactement 5 chiffres');

export const phoneSchema = z
  .string()
  .trim()
  .regex(/^\+?[0-9 ]{6,20}$/, 'Numéro de téléphone invalide');

export const amountSchema = z
  .number({ invalid_type_error: 'Montant invalide' })
  .positive('Le montant doit être supérieur à 0')
  .max(1_000_000, 'Montant trop élevé');

export const accountNoSchema = z
  .string()
  .trim()
  .min(4, 'Trop court')
  .max(64, 'Trop long')
  .regex(/^[A-Za-z0-9@._-]+$/, 'Caractères non autorisés');

export const otpSchema = z.string().regex(/^\d{6}$/, 'Code à 6 chiffres');

export const transferSchema = z.object({
  amount: amountSchema,
  from_account: accountNoSchema,
  to_account: accountNoSchema,
  payment_method: z.string().min(1),
  wallet_id: z.string().min(1, 'Sélectionnez un portefeuille'),
});

export const depositSchema = z.object({
  amount: amountSchema,
  payment_method: z.string().min(1),
  wallet_id: z.string().min(1, 'Sélectionnez un portefeuille'),
  phone: phoneSchema.optional(),
});
