import { create } from "zustand";

function makeDraftId() {
  return `draft-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

export const useCreateDraftStore = create((set, get) => ({
  currentDraftId: null,
  drafts: {},

  clearDraft: (draftId) =>
    set((state) => {
      const targetId = draftId || state.currentDraftId;
      if (!targetId) return state;

      const nextDrafts = { ...state.drafts };
      delete nextDrafts[targetId];

      return {
        currentDraftId:
          state.currentDraftId === targetId ? null : state.currentDraftId,
        drafts: nextDrafts,
      };
    }),

  getDraft: (draftId) => {
    const state = get();
    const targetId = draftId || state.currentDraftId;
    return targetId ? state.drafts[targetId] : null;
  },

  setDraft: (draft) => {
    const draftId = draft.id || makeDraftId();

    set((state) => ({
      currentDraftId: draftId,
      drafts: {
        ...state.drafts,
        [draftId]: {
          createdAt: Date.now(),
          editMeta: {},
          ...draft,
          id: draftId,
          originalUri: draft.originalUri || draft.uri,
        },
      },
    }));

    return draftId;
  },

  updateDraft: (draftId, patch) =>
    set((state) => {
      const targetId = draftId || state.currentDraftId;
      const draft = targetId ? state.drafts[targetId] : null;
      if (!draft) return state;

      return {
        currentDraftId: targetId,
        drafts: {
          ...state.drafts,
          [targetId]: {
            ...draft,
            ...patch,
            editMeta: {
              ...(draft.editMeta || {}),
              ...(patch.editMeta || {}),
            },
          },
        },
      };
    }),
}));
