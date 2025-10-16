import AccountCreated, { subject as subjectAccountCreated } from './AccountCreated.js';

export const EmailTemplates = {
  'account.created': {
    component: AccountCreated,
    subject: subjectAccountCreated,
    mapData: (data) => ({ name: data?.user_name || data?.email || 'friend' }),
  },
};


