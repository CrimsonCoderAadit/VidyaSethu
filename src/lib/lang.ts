import { cookies } from "next/headers";
import { asLang, LANG_COOKIE, t, type Lang } from "./i18n";

/** The reader's chosen UI language (cookie), for Server Components. */
export async function getLang(): Promise<Lang> {
  return asLang((await cookies()).get(LANG_COOKIE)?.value);
}

/** Server-side translator bound to the current request's language. */
export async function getT() {
  const lang = await getLang();
  return { lang, t: (s: string) => t(lang, s) };
}
