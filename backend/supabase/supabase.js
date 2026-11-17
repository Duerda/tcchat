import { createClient } from "https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/+esm";
import { auth } from "../firebase/config.js";

const SUPABASE_URL = "https://javvskvyodxdpbzprpur.supabase.co";
const SUPABASE_KEY = "sb_publishable_FVipwW12oNMr9tYfmevkZw_1RjLdjSq";
export const SUPABASE_STORAGE_BUCKET = "tcchat-arquivos";

// O Supabase Storage usará a mesma sessão já aberta no Firebase. O token é
// obtido sob demanda, então não armazenamos credenciais de usuário no cliente.
// Para autorizar este token, também será necessário habilitar Firebase Auth
// como provedor de terceiros no projeto Supabase, emitir a claim `role` como
// `authenticated` e configurar as políticas RLS descritas em docs/md/supabase_upload_demo.md.
export const supabase = createClient(SUPABASE_URL, SUPABASE_KEY, {
    accessToken: async () => {
        const user = auth.currentUser;
        return user ? user.getIdToken() : null;
    },
});
