import { NextResponse } from 'next/server';
import { Resend } from 'resend';

const resend = new Resend(process.env.RESEND_API_KEY);

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { email, link, role, clubName } = body;

    const { data, error } = await resend.emails.send({
      from: 'Gesteam Pro <onboarding@resend.dev>',
      to: [email],
      subject: `Invitation à rejoindre ${clubName || 'le club'}`,
      html: `<p>Invitation pour ${role} : <a href="${link}">Cliquez ici</a></p>`
    });

    if (error) {
      return NextResponse.json({ error }, { status: 400 });
    }

    return NextResponse.json(data);
  } catch (error) {
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
  }
}