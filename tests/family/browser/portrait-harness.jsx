import React from 'react';
import { createRoot } from 'react-dom/client';
import { Portrait } from '../../../src/family/Scene.jsx';
export function mountBrokenPortrait() {
  const host = document.createElement('div'); host.id = 'portrait-test'; document.body.append(host);
  createRoot(host).render(<svg width="100" height="100"><Portrait person={{ id: 'broken', first: 'Test', last: 'Person', photo: '/missing-fictional-photo.png' }} /></svg>);
}
