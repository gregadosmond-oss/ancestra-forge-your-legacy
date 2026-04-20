/// <reference types="npm:@types/react@18.3.1" />

import * as React from 'npm:react@18.3.1'

import {
  Body,
  Button,
  Container,
  Head,
  Heading,
  Html,
  Preview,
  Section,
  Text,
} from 'npm:@react-email/components@0.0.22'

interface SignupEmailProps {
  siteName: string
  siteUrl: string
  recipient: string
  confirmationUrl: string
}

export const SignupEmail = ({
  confirmationUrl,
}: SignupEmailProps) => (
  <Html lang="en" dir="ltr">
    <Head />
    <Preview>Your story is waiting — confirm your AncestorsQR email</Preview>
    <Body style={main}>
      <Container style={container}>
        <Text style={brand}>ANCESTORSQR</Text>
        <Heading style={h1}>Your story is waiting.</Heading>
        <Text style={text}>
          Welcome to AncestorsQR — every family has a story worth telling.
        </Text>
        <Text style={text}>
          Confirm your email to begin your journey and unlock your family's legacy.
        </Text>
        <Section style={buttonWrap}>
          <Button style={button} href={confirmationUrl}>
            Confirm My Email
          </Button>
        </Section>
        <Text style={footerItalic}>
          Every family has a story worth telling.
        </Text>
        <Text style={footer}>
          ANCESTORSQR — EST. 2026
        </Text>
      </Container>
    </Body>
  </Html>
)

export default SignupEmail

const main = {
  backgroundColor: '#ffffff',
  fontFamily: "'DM Sans', Arial, sans-serif",
}
const container = {
  padding: '40px 32px',
  maxWidth: '480px',
  margin: '0 auto',
  backgroundColor: '#0d0a07',
  borderRadius: '22px',
}
const brand = {
  fontFamily: "'Libre Caslon Display', Georgia, serif",
  fontSize: '14px',
  color: '#d4a04a',
  textAlign: 'center' as const,
  letterSpacing: '4px',
  margin: '0 0 32px',
  fontWeight: 'normal' as const,
}
const h1 = {
  fontFamily: "'Libre Caslon Display', Georgia, serif",
  fontSize: '28px',
  fontWeight: 'normal' as const,
  color: '#f0e8da',
  margin: '0 0 20px',
  textAlign: 'center' as const,
  lineHeight: '1.3',
}
const text = {
  fontSize: '15px',
  color: '#d0c4b4',
  lineHeight: '1.6',
  margin: '0 0 20px',
  textAlign: 'center' as const,
}
const buttonWrap = {
  textAlign: 'center' as const,
  margin: '32px 0 32px',
}
const button = {
  background: 'linear-gradient(135deg, #e8943a, #c47828)',
  color: '#1a1208',
  fontSize: '13px',
  fontWeight: 600,
  letterSpacing: '1.5px',
  textTransform: 'uppercase' as const,
  borderRadius: '60px',
  padding: '16px 40px',
  textDecoration: 'none',
  display: 'inline-block',
}
const footerItalic = {
  fontFamily: "'Libre Caslon Text', Georgia, serif",
  fontStyle: 'italic' as const,
  fontSize: '12px',
  color: '#8a7e6e',
  margin: '40px 0 12px',
  textAlign: 'center' as const,
}
const footer = {
  fontSize: '10px',
  color: '#8a7e6e',
  textAlign: 'center' as const,
  letterSpacing: '3px',
  margin: '0',
}
