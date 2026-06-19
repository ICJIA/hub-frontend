import React from 'react';
import { useState } from 'react';
import { Button, Modal, Box, IconButton } from '@strapi/design-system';
import { Cross } from '@strapi/icons';
import { generateToken } from '../utils/previewToken';

declare const window: typeof globalThis & {
    location: {
        pathname: any;
        origin: string;
        reload: () => void; 
    };
    open: (url: string, target?: string) => void;
    document: any;
};

const PreviewButton = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [previewUrl, setPreviewUrl] = useState('');
  const [title, setTitle] = useState('');

  const getContentTypeAndId = () => {
    const path = window.location.pathname;
    const matches = path.match(/\/content-manager\/collection-types\/([^/]+)\/([^/]+)/);
    if (!matches) return null;
    const [, contentType, id] = matches;
    return { contentType, id };
  };

  const handlePreview = async () => {
    const result = getContentTypeAndId();
    if (!result) return;
    const { contentType, id } = result;
    const token = await generateToken();

    if (contentType.includes('dataset')) {
      setTitle('Live Preview Mode');
      setPreviewUrl(`https://research-hub-dev.netlify.app/datasetpreview/${id}?token=${token}`);
      setIsOpen(true);
    } else if (contentType.includes('article')) {
      setTitle('Live Preview Mode');
      setPreviewUrl(`https://research-hub-dev.netlify.app/preview/${id}?token=${token}`);
      setIsOpen(true);
    } else if (contentType.includes('app')) {
      setTitle('Live Preview Mode');
      setPreviewUrl(`https://research-hub-dev.netlify.app/appspreview/${id}?token=${token}`);
      setIsOpen(true);
    }
  };

  const handleReadonlyPreview = async () => {
    const result = getContentTypeAndId();
    if (!result) return;
    const { contentType, id } = result;
    const token = await generateToken();

    if (contentType.includes('dataset')) {
      setTitle('Preview Mode');
      setPreviewUrl(`https://research-hub-dev.netlify.app/datasetpreviewreadonly/${id}?token=${token}`);
      setIsOpen(true);
    } else if (contentType.includes('article')) {
      setTitle('Preview Mode');
      setPreviewUrl(`https://research-hub-dev.netlify.app/previewreadonly/${id}?token=${token}`);
      setIsOpen(true);
    } else if (contentType.includes('app')) {
      setTitle('Preview Mode');
      setPreviewUrl(`https://research-hub-dev.netlify.app/appspreviewreadonly/${id}?token=${token}`);
      setIsOpen(true);
    }
  };

  const handleClose = () => {
    setIsOpen(false);
    setPreviewUrl('');
    if(title === 'Live Preview Mode') {
    window.location.reload(); // Refresh the page to reset any state changes
    }
  };

  return (
    <>
      <Button variant="secondary" onClick={handlePreview}>
        Live Preview
      </Button>


      <Button variant="secondary" onClick={handleReadonlyPreview}>
        Preview
      </Button>

      <Modal.Root open={isOpen} onOpenChange={handleClose}>
        <Modal.Content
          style={{
            maxWidth: '95vw',
            width: '95vw',
            maxHeight: '95vh',
          }}
        >
          <Modal.Header>
            <Modal.Title>{title}</Modal.Title>
            
          </Modal.Header>
          <Modal.Body style={{ padding: 0 }}>
            <Box style={{ height: '85vh' }}>
              <iframe
                src={previewUrl}
                style={{
                  width: '100%',
                  height: '100%',
                  border: 'none',
                }}
                title="Article Preview"
              />
            </Box>
          </Modal.Body>
        </Modal.Content>
      </Modal.Root>
    </>
  );
};

export { PreviewButton };
