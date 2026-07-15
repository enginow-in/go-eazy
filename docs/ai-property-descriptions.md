# AI property descriptions

Property owners can request a draft description from the Basic Details step of the property form. The result is placed in the normal editable description field; it is never generated over existing text, and the owner must review it before submitting.

## Edge Function setup

The browser calls the authenticated `generate-property-description` Supabase Edge Function. The function validates the user session and listing metadata, then calls OpenAI using server-side secrets. No OpenAI key is exposed to the Vite bundle and the function does not write listing data to the database.

```bash
supabase functions deploy generate-property-description
supabase secrets set OPENAI_API_KEY=your_openai_api_key OPENAI_MODEL=gpt-4o-mini
```

`OPENAI_MODEL` is optional and defaults to `gpt-4o-mini`. Never use a `VITE_` prefix for these secrets.

## Adding checks

Keep the input contract restricted to factual listing metadata. If the prompt or checks change, increment the documented scoring/prompt version in the function and verify that generated text does not invent amenities, availability, measurements, or contact details.

## Local testing

Run the frontend with the normal Supabase URL and anon key, deploy or serve the function locally, and sign in as a landlord. Enter a title and leave the description empty, then select **Generate with AI**. Test missing authentication, an empty title, an existing description, a function error, and a successful editable draft.
