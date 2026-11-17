import type { SurveyStatus } from '../lib/types';
import { Badge } from './ui';

export function StatusBadge({ status }: { status: SurveyStatus }) {
  return (
    <Badge tone={status === 'PUBLISHED' ? 'published' : 'draft'}>
      {status === 'PUBLISHED' ? 'Published' : 'Draft'}
    </Badge>
  );
}
