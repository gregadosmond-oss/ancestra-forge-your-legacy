/// <reference types="npm:@types/react@18.3.1" />

import * as React from 'npm:react@18.3.1'

import {
  Body,
  Container,
  Head,
  Heading,
  Html,
  Preview,
  Section,
  Text,
} from 'npm:@react-email/components@0.0.22'

interface MagicLinkEmailProps {
  siteName?: string
  confirmationUrl?: string
  token?: string
}

export const MagicLinkEmail = ({ token }: MagicLinkEmailProps) => {
  const code = token ?? '——————'
  return (
    <Html lang="en" dir="ltr">
      <Head />
      <Preview>Your AncestorsQR code — {code}</Preview>
      <Body style={main}>
        <Container style={outer}>
          <Container style={container}>
            <Text style={brand}>ANCESTORSQR</Text>
            <Heading style={h1}>Your code is ready.</Heading>
            <Text style={subline}>
              Enter this code to read your family story.
            </Text>
            <Section style={codeCard}>
              <Text style={codeStyle}>{code}</Text>
            </Section>
            <Text style={expires}>This code expires in 10 minutes.</Text>
            <Text style={footerItalic}>
              Every family has a story worth telling.
            </Text>
            <Text style={footerSmall}>ANCESTORSQR — EST. 2026</Text>
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
  fontFamily: "'Libre Caslon Display', Georgia, serif",
  fontSize: '30px',
  fontWeight: 400 as const,
  color: '#f0e8da',
  lineHeight: 1.25,
  margin: '0 0 14px',
}
const subline = {
  fontFamily: "'Libre Caslon Text', Georgia, serif",
  fontStyle: 'italic' as const,
  fontSize: '15px',
  color: '#c4b8a6',
  lineHeight: 1.6,
  margin: '0 0 28px',
}
const codeCard = {
  backgroundColor: '#1a1510',
  border: '1px solid rgba(212,160,74,0.15)',
  borderRadius: '14px',
  padding: '28px 16px',
  margin: '0 auto 18px',
}
const codeStyle = {
  fontFamily: "'DM Sans', Arial, sans-serif",
  fontSize: '36px',
  fontWeight: 700 as const,
  color: '#d4a04a',
  letterSpacing: '8px',
  margin: 0,
  textAlign: 'center' as const,
}
const expires = {
  fontFamily: "'DM Sans', Arial, sans-serif",
  fontSize: '12px',
  color: '#8a7e6e',
  margin: '0 0 40px',
}
const footerItalic = {
  fontFamily: "'Libre Caslon Text', Georgia, serif",
  fontStyle: 'italic' as const,
  fontSize: '11px',
  color: '#8a7e6e',
  margin: '0 0 8px',
}
const footerSmall = {
  fontFamily: "'DM Sans', Arial, sans-serif",
  fontSize: '10px',
  color: '#8a7e6e',
  letterSpacing: '3px',
  textTransform: 'uppercase' as const,
  margin: 0,
}
