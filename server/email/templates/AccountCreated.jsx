import DefaultLayout from '../layouts/DefaultLayout.jsx';

export function subject({ name }) {
  return `Welcome to Swiper, ${name || 'there'}!`;
}

export default function AccountCreated({ name }) {
  return (
    <DefaultLayout title="Welcome to Swiper" preheader="Your account is ready">
      <p style={{ fontSize: 14, lineHeight: 1.6 }}>Hi {name || 'there'},</p>
      <p style={{ fontSize: 14, lineHeight: 1.6 }}>
        Thanks for joining Swiper. Let’s get your first workout set up.
      </p>
    </DefaultLayout>
  );
}


