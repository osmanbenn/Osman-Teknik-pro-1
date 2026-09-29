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
    for (const [uid, role] of [['owner', 'admin'], ['tech', 'teknisyen'], ['apprentice', 'cirak']]) {
      await setDoc(doc(db, 'users', uid), { uid, role, displayName: uid });
    }
    await setDoc(doc(db, 'repairs', 'legacy'), { stage: 'kabul' });
    await setDoc(doc(db, 'services', 'new'), { stage: 'kabul' });
  });

  const anonymous = env.unauthenticatedContext().firestore();
  const owner = env.authenticatedContext('owner').firestore();
  const tech = env.authenticatedContext('tech').firestore();
  const apprentice = env.authenticatedContext('apprentice').firestore();
  const newcomer = env.authenticatedContext('newcomer').firestore();

  await assertFails(getDoc(doc(anonymous, 'repairs', 'legacy')));
  await assertFails(getDoc(doc(newcomer, 'repairs', 'legacy')));
  await assertFails(getDoc(doc(tech, 'repairs', 'legacy')));
  await assertSucceeds(getDoc(doc(owner, 'repairs', 'legacy')));
  await assertFails(getDoc(doc(tech, 'users', 'owner')));
  await assertSucceeds(getDoc(doc(tech, 'users', 'tech')));
  await assertFails(setDoc(doc(newcomer, 'users', 'newcomer'), { uid: 'newcomer', role: 'teknisyen' }));
  await assertFails(setDoc(doc(tech, 'users', 'tech'), { role: 'admin' }, { merge: true }));
  await assertFails(setDoc(doc(owner, 'users', 'owner'), { displayName: 'Yeni' }, { merge: true }));
  await assertSucceeds(setDoc(doc(owner, 'repairs', 'legacy'), { stage: 'onarimda' }));
  await assertFails(setDoc(doc(tech, 'repairs', 'legacy'), { stage: 'hazir' }));
  await assertFails(getDoc(doc(apprentice, 'services', 'new')));
  await assertSucceeds(getDoc(doc(owner, 'services', 'new')));
  await assertSucceeds(setDoc(doc(owner, 'services', 'new'), { stage: 'hazir' }));
  await assertFails(deleteDoc(doc(tech, 'services', 'new')));
  await assertFails(setDoc(doc(owner, 'sales', 'sale1'), { total: 0 }));
  await assertFails(getDoc(doc(owner, 'test', 'connection')));
  console.log('Firestore rules: 17 authorization scenarios passed.');
} finally {
  await env.cleanup();
}
