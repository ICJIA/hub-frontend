import React from 'react';
import { useState, useEffect } from 'react';
import { Modal, Box, IconButton } from '@strapi/design-system';
import { Cross } from '@strapi/icons';
import { generateToken } from '../utils/previewToken';

interface EditorEventDetail {
  documentId: string;
}

declare const window: typeof globalThis & {
    location: {
        pathname: any;
        origin: string;
        reload: () => void;
    };
    open: (url: string, target?: string) => void;
    document: any;
    addEventListener: any;
    dispatchEvent: (event: CustomEvent) => void;
    removeEventListener: any;
};

const CustomEditorModal = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [documentId, setDocumentId] = useState<string | null>(null);

  const EDITOR_URL = 'https://research-hub-dev.netlify.app/preview';

  useEffect(() => {
    const handler = (e: CustomEvent<EditorEventDetail>) => {
      setDocumentId(e.detail.documentId);
      setIsOpen(true);
    };

    window.addEventListener('open-custom-editor', handler as any);
    return () => window.removeEventListener('open-custom-editor', handler as any);
  }, []);

  // Listen for messages from the iframe
  useEffect(() => {
    const messageHandler = (e: MessageEvent) => {
      // Validate origin if using external URL
      // if (e.origin !== 'https://your-editor-domain.com') return;

      if (e.data?.type === 'EDITOR_CLOSE') {
        handleClose();
      }
      if (e.data?.type === 'EDITOR_SAVED') {
        handleClose();
        // Refresh the list
        window.location.reload();
      }
    };

    window.addEventListener('message', messageHandler);
    return () => window.removeEventListener('message', messageHandler);
  }, []);

  const handleClose = () => {
    setIsOpen(false);
    setDocumentId(null);
    // Refresh to show the new entry in the list
    window.location.reload();
  };

  if (!isOpen || !documentId) return null;

  return (
    <Modal.Root open={isOpen} onOpenChange={handleClose}>
      <Modal.Content 
        style={{ 
          maxWidth: '95vw', 
          width: '95vw',
          maxHeight: '95vh',
        }}
      >
        <Modal.Header>
          <Modal.Title>Article Editor</Modal.Title>
          
        </Modal.Header>
        <Modal.Body style={{ padding: 0 }}>
          <Box style={{ height: '85vh' }}>
            <iframe
              src={`${EDITOR_URL}/${documentId}?token=${generateToken()}`}
              style={{
                width: '100%',
                height: '100%',
                border: 'none',
              }}
              title="Custom Article Editor"
            />
          </Box>
        </Modal.Body>
      </Modal.Content>
    </Modal.Root>
  );
};

export default CustomEditorModal;