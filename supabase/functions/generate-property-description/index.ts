/// <reference lib="deno.ns" />

import { serve } from "https://deno.land/std@0.224.0/http/server.ts"

interface PropertyRequest {
  title?: string
  propertyType?: string
  city?: string
  locality?: string
  rent?: number | string
  amenities?: string[]
  nearbyLandmarks?: string
}

serve(async (req: Request) => {
  try {
    if (req.method !== "POST") {
      return new Response(
        JSON.stringify({
          error: "Method not allowed"
        }),
        {
          status: 405,
          headers: {
            "Content-Type": "application/json"
          }
        }
      )
    }

    const body: PropertyRequest = await req.json()

    const {
      title,
      propertyType,
      city,
      locality,
      rent,
      amenities,
      nearbyLandmarks
    } = body


    const geminiKey = Deno.env.get("GEMINI_API_KEY")

    if (!geminiKey) {
      return new Response(
        JSON.stringify({
          error: "GEMINI_API_KEY is not configured"
        }),
        {
          status: 500,
          headers: {
            "Content-Type": "application/json"
          }
        }
      )
    }


    const prompt = `
You are an expert real estate copywriter.

Create an attractive rental property description.

Property Details:

Title:
${title || "Property"}

Property Type:
${propertyType || "Rental property"}

Location:
${locality || ""}, ${city || ""}

Monthly Rent:
₹${rent || ""}

Amenities:
${amenities?.join(", ") || "Not specified"}

Nearby Landmarks:
${nearbyLandmarks || "Not specified"}


Writing requirements:

- Write exactly 3 paragraphs.
- Make it appealing to potential tenants.
- Keep it professional and trustworthy.
- Mention location naturally.
- Highlight amenities.
- Make it SEO-friendly.
- Do not make false claims.
- End with a call to schedule a visit.
`


    const geminiResponse = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${geminiKey}`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          contents: [
            {
              parts: [
                {
                  text: prompt
                }
              ]
            }
          ],
          generationConfig: {
            temperature: 0.7,
            maxOutputTokens: 500
          }
        })
      }
    )


    if (!geminiResponse.ok) {
      const errorText = await geminiResponse.text()

      return new Response(
        JSON.stringify({
          error: "Gemini API failed",
          details: errorText
        }),
        {
          status: 500,
          headers: {
            "Content-Type": "application/json"
          }
        }
      )
    }


    const geminiData = await geminiResponse.json()


    const description =
      geminiData?.candidates?.[0]?.content?.parts?.[0]?.text ||
      "Unable to generate description."


    return new Response(
      JSON.stringify({
        description
      }),
      {
        status: 200,
        headers: {
          "Content-Type": "application/json"
        }
      }
    )


  } catch (error) {

    return new Response(
      JSON.stringify({
        error:
          error instanceof Error
            ? error.message
            : "Unknown error occurred"
      }),
      {
        status: 500,
        headers: {
          "Content-Type": "application/json"
        }
      }
    )
  }
})