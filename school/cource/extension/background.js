'use strict';

// Scratchタブでのみパネルを有効化
chrome.tabs.onUpdated.addListener(async (tabId, info, tab) => {
  if (!tab.url) return;

  let isScratch = false;
  try {
    isScratch = new URL(tab.url).origin === 'https://scratch.mit.edu';
  } catch (_) {}

  await chrome.sidePanel.setOptions({
    tabId,
    path: 'sidepanel.html',
    enabled: isScratch
  });
});

// 拡張機能アイコンクリックでパネルを開く
chrome.action.onClicked.addListener(tab => {
  chrome.sidePanel.open({ tabId: tab.id });
});
