import { createClient } from "https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/+esm";
import { auth } from "../firebase/config.js";

const SUPABASE_URL = "https://javvskvyodxdpbzprpur.supabase.co";
const SUPABASE_KEY = "sb_publishable_FVipwW12oNMr9tYfmevkZw_1RjLdjSq";

// O Supabase Storage usará a mesma sessão já aberta no Firebase. O token é
// obtido sob demanda, então não armazenamos credenciais de usuário no cliente.
// Para autorizar este token, também será necessário habilitar Firebase Auth
// como provedor de terceiros no projeto Supabase e configurar as políticas RLS.
export const supabase = createClient(SUPABASE_URL, SUPABASE_KEY, {
    accessToken: async () => {
        const user = auth.currentUser;
        return user ? user.getIdToken() : null;
    },
});
