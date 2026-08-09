import * as fs from 'node:fs';
import * as path from 'node:path';
import type { ParticipantPool } from '../data/participantData';
import { ParticipantPoolFileSchema } from '../schemas/participant.schema';
import type { ParticipantRequestApiResponse } from '../schemas/participant.schema';

const POOL_FILE = path.join(process.cwd(), '.cache', 'participant-pool.json');

export function loadParticipantPool(): ParticipantPool | null {
  if (!fs.existsSync(POOL_FILE)) return null;

  const raw = JSON.parse(fs.readFileSync(POOL_FILE, 'utf8')) as unknown;
  return ParticipantPoolFileSchema.parse(raw);
}

export function saveParticipantPool(pool: ParticipantPool): void {
  fs.mkdirSync(path.dirname(POOL_FILE), { recursive: true });
  fs.writeFileSync(POOL_FILE, `${JSON.stringify(pool, null, 2)}\n`, 'utf8');
}

export function toParticipantPool(
  tournamentId: string,
  nominationId: string,
  responses:    ParticipantRequestApiResponse[],
): ParticipantPool {
  return {
    tournamentId,
    nominationId,
    participants: responses.map(item => ({
      requestId: item._id,
      userId:    item.user._id,
      name:      item.user.name,
      email:     item.user.email,
    })),
  };
}
