import { Html, Head, Preview, Body, Container, Section } from '@react-email/components';

export default function DefaultLayout({ title = 'Notification', preheader = '', children, footer }) {
  return (
    <Html>
      <Head />
      <Preview>{preheader}</Preview>
      <Body style={{ backgroundColor: '#f8fafc', margin: 0, padding: 0, fontFamily: 'system-ui,-apple-system,Segoe UI,Roboto,Ubuntu,Cantarell,Noto Sans,sans-serif', color: '#0f172a' }}>
        <Container style={{ maxWidth: 560, margin: '0 auto', padding: 24 }}>
          <Section style={{ background: '#fff', border: '1px solid #e5e7eb', borderRadius: 12, padding: 20 }}>
            <h1 style={{ fontSize: 18, margin: '0 0 8px 0', color: '#111827' }}>{title}</h1>
            {children}
            {footer ? <div>{footer}</div> : null}
          </Section>
        </Container>
      </Body>
    </Html>
  );
}


