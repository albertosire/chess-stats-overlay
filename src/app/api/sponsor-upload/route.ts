import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getCurrentUserIsPro } from "@/lib/billing/entitlements";

export async function POST(request: Request) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: "Não autenticado." }, { status: 401 });
    }

    const isPro = await getCurrentUserIsPro(user.id);
    if (!isPro) {
      return NextResponse.json({ error: "Recurso Pro." }, { status: 403 });
    }

    const formData = await request.formData();
    const file = formData.get("file");
    if (!(file instanceof File)) {
      return NextResponse.json({ error: "Arquivo obrigatório." }, { status: 400 });
    }

    if (file.size > 2 * 1024 * 1024) {
      return NextResponse.json({ error: "Máximo 2MB." }, { status: 400 });
    }

    const ext = file.name.split(".").pop() || "png";
    const path = `${user.id}/sponsor.${ext}`;
    const buffer = Buffer.from(await file.arrayBuffer());

    const { error } = await supabase.storage.from("sponsor-logos").upload(path, buffer, {
      upsert: true,
      contentType: file.type || "image/png",
    });

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    const { data } = supabase.storage.from("sponsor-logos").getPublicUrl(path);
    return NextResponse.json({ url: data.publicUrl });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Upload falhou." },
      { status: 500 },
    );
  }
}
