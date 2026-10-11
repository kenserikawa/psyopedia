import { revalidatePath } from "next/cache";

export function revalidateModeration() {
  revalidatePath("/[locale]/admin", "layout");
}

export function revalidateOperations() {
  revalidatePath("/[locale]", "page");
  revalidatePath("/[locale]/catalog", "page");
  revalidatePath("/[locale]/catalog/[slug]", "page");
  revalidatePath("/[locale]/iceberg", "page");
  revalidatePath("/sitemap.xml");
}
