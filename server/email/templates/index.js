import AccountCreated, { subject as subjectAccountCreated } from './AccountCreated.js';
import TrainerInvitation, { subject as subjectTrainerInvitation } from './TrainerInvitation.js';
import ClientInvitation, { subject as subjectClientInvitation } from './ClientInvitation.js';
import JoinTrainerInvitation, { subject as subjectJoinTrainerInvitation } from './JoinTrainerInvitation.js';
import JoinClientInvitation, { subject as subjectJoinClientInvitation } from './JoinClientInvitation.js';

const DEFAULT_ACCEPT_URL = 'https://www.swiper.fit/accept-invite';
const mapInviteData = (data = {}) => ({
  inviterName: data.inviter_name || 'John Smith',
  ctaUrl: data.cta_url || DEFAULT_ACCEPT_URL,
});

export const EmailTemplates = {
  'account.created': {
    component: AccountCreated,
    subject: subjectAccountCreated,
    mapData: (data) => ({ name: data?.user_name || data?.email || 'friend' }),
  },
  'trainer.invitation': {
    component: TrainerInvitation,
    subject: subjectTrainerInvitation,
    mapData: mapInviteData,
  },
  'client.invitation': {
    component: ClientInvitation,
    subject: subjectClientInvitation,
    mapData: mapInviteData,
  },
  'join.trainer-invitation': {
    component: JoinTrainerInvitation,
    subject: subjectJoinTrainerInvitation,
    mapData: mapInviteData,
  },
  'join.client-invitation': {
    component: JoinClientInvitation,
    subject: subjectJoinClientInvitation,
    mapData: mapInviteData,
  },
};


