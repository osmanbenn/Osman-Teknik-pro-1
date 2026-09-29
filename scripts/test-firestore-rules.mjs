import { readFileSync } from 'node:fs';
import { initializeTestEnvironment, assertFails, assertSucceeds } from '@firebase/rules-unit-testing';
import { doc, getDoc, setDoc, deleteDoc } from 'firebase/firestore';

const env = await initializeTestEnvironment({
  projectId: 'demo-osman-teknik',
  firestore: {
    host: '127.0.0.1',
    port: 8088,
    rules: readFileSync('firestore.rules', 'utf8')
  }
});

try {
  await env.withSecurityRulesDisabled(async context => {
    const db = context.firestore();
    for (const [uid, role] of [['owner', 'yonetici'], ['tech', 'teknisyen'], ['apprentice', 'cirak']]) {
      await setDoc(doc(db, 'users', uid), { uid, role, displayName: uid });
    }
    await setDoc(doc(db, 'services', 's1'), { stage: 'kabul' });
    await setDoc(doc(db, 'sales', 'sale1'), { total: 100 });
  });

  const anonymous = env.unauthenticatedContext().firestore();
  const owner = env.authenticatedContext('owner').firestore();
  const tech = env.authenticatedContext('tech').firestore();
  const apprentice = env.authenticatedContext('apprentice').firestore();
  const newcomer = env.authenticatedContext('newcomer').firestore();

  await assertFails(getDoc(doc(anonymous, 'services', 's1')));
  await assertFails(getDoc(doc(newcomer, 'services', 's1')));
  await assertFails(getDoc(doc(tech, 'users', 'owner')));
  await assertSucceeds(getDoc(doc(tech, 'users', 'tech')));
  await assertSucceeds(setDoc(doc(newcomer, 'users', 'newcomer'), { uid: 'newcomer', role: 'teknisyen' }));
  await assertFails(setDoc(doc(newcomer, 'users', 'newcomer'), { role: 'yonetici' }, { merge: true }));
  await assertFails(setDoc(doc(tech, 'users', 'tech'), { role: 'yonetici' }, { merge: true }));
  await assertSucceeds(setDoc(doc(tech, 'users', 'tech'), { displayName: 'Teknisyen' }, { merge: true }));
  await assertSucceeds(setDoc(doc(tech, 'services', 's1'), { stage: 'onarimda' }));
  await assertFails(setDoc(doc(apprentice, 'services', 's1'), { stage: 'hazir' }));
  await assertFails(deleteDoc(doc(tech, 'services', 's1')));
  await assertSucceeds(deleteDoc(doc(owner, 'services', 's1')));
  await assertSucceeds(getDoc(doc(apprentice, 'sales', 'sale1')));
  await assertFails(setDoc(doc(owner, 'sales', 'sale1'), { total: 0 }));
  await assertFails(setDoc(doc(owner, 'stock', 'x'), { quantity: 999 }));
  await assertFails(getDoc(doc(owner, 'test', 'connection')));
  console.log('Firestore rules: 16 authorization scenarios passed.');
} finally {
  await env.cleanup();
}
