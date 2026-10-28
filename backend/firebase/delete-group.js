import { collection, doc, getDoc, getDocs, writeBatch } from "https://www.gstatic.com/firebasejs/12.14.0/firebase-firestore.js";
import { db } from "./config.js";

const GROUP_SUBCOLLECTIONS = ["mensagens", "anotacoes", "arquivos", "entregas", "submissoes"];
const MAX_BATCH_WRITES = 450;

async function deleteSubcollection(groupId, collectionName) {
  const snapshot = await getDocs(collection(db, "grupos", groupId, collectionName));

  for (let start = 0; start < snapshot.docs.length; start += MAX_BATCH_WRITES) {
    const batch = writeBatch(db);
    snapshot.docs
      .slice(start, start + MAX_BATCH_WRITES)
      .forEach((item) => batch.delete(item.ref));
    await batch.commit();
  }
}

async function unlinkMembers(groupId, memberIds) {
  const uniqueMemberIds = [...new Set(memberIds)];

  for (let start = 0; start < uniqueMemberIds.length; start += MAX_BATCH_WRITES) {
    const memberRefs = uniqueMemberIds
      .slice(start, start + MAX_BATCH_WRITES)
      .map((memberId) => doc(db, "usuarios", memberId));
    const profiles = await Promise.all(memberRefs.map((profileRef) => getDoc(profileRef)));
    const batch = writeBatch(db);

    profiles.forEach((profile, index) => {
      if (profile.exists() && profile.data().grupoId === groupId) {
        batch.update(memberRefs[index], { grupoId: "", grupoNome: "" });
      }
    });

    if (profiles.some((profile) => profile.exists() && profile.data().grupoId === groupId)) {
      await batch.commit();
    }
  }
}

export async function deleteGroupData(groupId) {
  const groupRef = doc(db, "grupos", groupId);
  const groupSnapshot = await getDoc(groupRef);
  if (!groupSnapshot.exists()) return false;

  for (const collectionName of GROUP_SUBCOLLECTIONS) {
    await deleteSubcollection(groupId, collectionName);
  }

  const latestGroupSnapshot = await getDoc(groupRef);
  if (!latestGroupSnapshot.exists()) return true;

  const group = latestGroupSnapshot.data();
  const memberIds = Array.isArray(group.membros) ? group.membros : [];
  await unlinkMembers(groupId, memberIds);

  const batch = writeBatch(db);
  batch.delete(groupRef);
  await batch.commit();
  return true;
}
