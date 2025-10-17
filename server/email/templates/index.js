import AccountCreated, { subject as subjectAccountCreated } from './AccountCreated.js';
import TrainerInvitation, { subject as subjectTrainerInvitation } from './TrainerInvitation.js';
import ClientInvitation, { subject as subjectClientInvitation } from './ClientInvitation.js';
import JoinTrainerInvitation, { subject as subjectJoinTrainerInvitation } from './JoinTrainerInvitation.js';
import JoinClientInvitation, { subject as subjectJoinClientInvitation } from './JoinClientInvitation.js';

export const EmailTemplates = {
  'account.created': {
    component: AccountCreated,
    subject: subjectAccountCreated,
    mapData: (data) => ({ name: data?.user_name || data?.email || 'friend' }),
  },
  'trainer.invitation': {
    component: TrainerInvitation,
    subject: subjectTrainerInvitation,
    mapData: (data) => ({
      inviterName: data?.inviter_name || 'John Smith',
    }),
  },
  'client.invitation': {
    component: ClientInvitation,
    subject: subjectClientInvitation,
    mapData: (data) => ({
      inviterName: data?.inviter_name || 'John Smith',
    }),
  },
  'join.trainer-invitation': {
    component: JoinTrainerInvitation,
    subject: subjectJoinTrainerInvitation,
    mapData: (data) => ({
      inviterName: data?.inviter_name || 'John Smith',
      email: data?.email || '',
    }),
  },
  'join.client-invitation': {
    component: JoinClientInvitation,
    subject: subjectJoinClientInvitation,
    mapData: (data) => ({
      inviterName: data?.inviter_name || 'John Smith',
      email: data?.email || '',
    }),
  },
};


