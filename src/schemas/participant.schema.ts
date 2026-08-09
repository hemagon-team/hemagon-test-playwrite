import { z } from 'zod';

const ParticipantUserSchema = z.object({
  _id:   z.string().min(1),
  name:  z.string().min(1),
  email: z.string().min(1),
}).passthrough();

export const ParticipantRequestApiResponseSchema = z.object({
  _id:        z.string().min(1),
  nomination: z.string().min(1),
  state:      z.literal('APPROVED'),
  paid:       z.boolean().optional(),
  presence:   z.boolean(),
  user:       ParticipantUserSchema,
}).passthrough();

export type ParticipantRequestApiResponse = z.infer<typeof ParticipantRequestApiResponseSchema>;

export const ParticipantPoolFileSchema = z.object({
  tournamentId: z.string().min(1),
  nominationId: z.string().min(1),
  participants: z.array(z.object({
    requestId: z.string().min(1),
    userId:    z.string().min(1),
    name:      z.string().min(1),
    email:     z.string().min(1),
  })).min(1),
});
