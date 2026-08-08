import { z } from 'zod';

export const projectFieldsSchema = z.object({
  titlePt: z.string().min(1, 'Obrigatório'),
  titleEn: z.string().min(1, 'Obrigatório'),
  descriptionPt: z.string().optional().default(''),
  descriptionEn: z.string().optional().default(''),
  slug: z
    .string()
    .regex(/^[a-z0-9]+(-[a-z0-9]+)*$/, 'Use apenas letras minúsculas, números e hífens'),
  type: z.enum(['design', 'code']),
  published: z.boolean(),
});

export type ProjectFields = z.infer<typeof projectFieldsSchema>;

export const newTagSchema = z.object({
  namePt: z.string().min(1),
  nameEn: z.string().min(1),
  category: z.enum(['topic', 'tool']),
});

export const newTagsArraySchema = z.array(newTagSchema);

export const pdfMetaSchema = z.object({
  pageCount: z.coerce.number().int().positive().optional(),
  aspectRatio: z.coerce.number().positive().optional(),
});
