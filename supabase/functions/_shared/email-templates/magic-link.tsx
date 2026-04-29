/// <reference types="npm:@types/react@18.3.1" />

import * as React from 'npm:react@18.3.1'

import {
  Body,
  Button,
  Container,
  Head,
  Heading,
  Html,
  Link,
  Preview,
  Section,
  Text,
} from 'npm:@react-email/components@0.0.22'

interface MagicLinkEmailProps {
  siteName?: string
  confirmationUrl?: string
  token?: string
}

export const MagicLinkEmail = ({ confirmationUrl }: MagicLinkEmailProps) => {
  const url = confirmationUrl ?? '#'
  return (
    <Html lang="en" dir="ltr">
      <Head />
      <Preview>Your AncestorsQR account is ready</Preview>
      <Body style={main}>
        <Container style={outer}>
          <Container style={container}>
            <Text style={brand}>ANCESTORSQR</Text>
            <Heading style={h1}>Your story begins here</Heading>
            <Text style={body}>
              Welcome to AncestorsQR. Click below to access your account, your
              saved searches, and your family's heritage tools — anytime, from
              any device.
            </Text>
            <Section style={buttonWrap}>
              <Button href={url} style={button}>
                Begin Your Journey
              </Button>
            </Section>
            <Text style={footerNote}>
              If you didn't request this, you can safely ignore this email.
            </Text>
            <Text style={signoff}>
              — AncestorsQR ·{' '}
              <Link href="https://ancestorsqr.com" style={signoffLink}>
                ancestorsqr.com
              </Link>
            </Text>
          </Container>
        </Container>
      </Body>
    </Html>
  )
}

export default MagicLinkEmail

const main = {
  backgroundColor: '#ffffff',
  fontFamily: "'DM Sans', Arial, sans-serif",
  margin: 0,
  padding: 0,
}
const outer = {
  backgroundColor: '#0d0a07',
  padding: '48px 16px',
  width: '100%',
}
const container = {
  maxWidth: '480px',
  margin: '0 auto',
  padding: '32px 24px',
  textAlign: 'center' as const,
  backgroundColor: '#0d0a07',
}
const brand = {
  fontFamily: "'Libre Caslon Display', Georgia, serif",
  fontSize: '18px',
  letterSpacing: '6px',
  color: '#d4a04a',
  margin: '0 0 32px',
  textTransform: 'uppercase' as const,
}
const h1 = {
  fontFamily: "'Libre Caslon Text', Georgia, serif",
  fontStyle: 'italic' as const,
  fontSize: '30px',
  fontWeight: 400 as const,
  color: '#d4a04a',
  lineHeight: 1.25,
  margin: '0 0 18px',
}
const body = {
  fontFamily: "'DM Sans', Arial, sans-serif",
  fontSize: '15px',
  color: '#c4b8a6',
  lineHeight: 1.65,
  margin: '0 0 32px',
}
const buttonWrap = {
  textAlign: 'center' as const,
  margin: '0 0 32px',
}
const button = {
  backgroundColor: '#d4a04a',
  color: '#0d0a07',
  fontFamily: "'DM Sans', Arial, sans-serif",
  fontSize: '13px',
  fontWeight: 600 as const,
  letterSpacing: '1.5px',
  textTransform: 'uppercase' as const,
  textDecoration: 'none',
  padding: '16px 40px',
  borderRadius: '60px',
  display: 'inline-block',
}
const footerNote = {
  fontFamily: "'DM Sans', Arial, sans-serif",
  fontSize: '12px',
  color: '#8a7e6e',
  margin: '0 0 24px',
}
const signoff = {
  fontFamily: "'Libre Caslon Text', Georgia, serif",
  fontStyle: 'italic' as const,
  fontSize: '12px',
  color: '#8a7e6e',
  margin: 0,
}
const signoffLink = {
  color: '#d4a04a',
  textDecoration: 'none',
}
