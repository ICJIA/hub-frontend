// src/admin/extensions/components/CustomCreateButton.tsx
import React from 'react';
import { useState, useEffect } from 'react';
import { Button, Loader } from '@strapi/design-system';
import { Plus } from '@strapi/icons';
import { useFetchClient } from '@strapi/admin/strapi-admin';
import { unstable_useContentManagerContext as useContentManagerContext } from '@strapi/content-manager/strapi-admin';

declare const window: typeof globalThis & {
    location: {
        pathname: any;
        origin: string;
    };
    open: (url: string, target?: string) => void;
    document: any;
    dispatchEvent: (event: CustomEvent) => void;
};

const STYLE_ID = 'hide-default-create-button';

const CustomCreateButton = () => {
  const [isCreating, setIsCreating] = useState(false);
  const { post } = useFetchClient();
  const { model } = useContentManagerContext();

  const isArticle = model === 'api::article.article';

  useEffect(() => {
    if (!isArticle) return;

    const style = document.createElement('style');
    style.id = STYLE_ID;
    // TODO: inspect your admin DOM and replace this selector with the actual one
    style.textContent = `[data-testid="create-new-document-button"] { display: none !important; }`;
    document.head.appendChild(style);

    return () => {
      document.getElementById(STYLE_ID)?.remove();
    };
  }, [isArticle]);

  // Only show for articles collection
  if (!isArticle) {
    return null;
  }

  const handleCreateAndEdit = async () => {
    setIsCreating(true);

    try {
      // Create a draft article with minimal required fields
      const response = await post(
        '/content-manager/collection-types/api::article.article',
        {
          // Adjust these fields based on your Article schema
          // Include only required fields with placeholder values
          title: 'Untitled Article',
          // slug: 'untitled-' + Date.now(), // if slug is required
          // Add other required fields here
        }
      );

      // Get the documentId from the response
      const documentId = response.data.data.documentId;

      // Dispatch event to open the modal
      window.dispatchEvent(
        new CustomEvent('open-custom-editor', {
          detail: { documentId },
        })
      );
    } catch (error) {
      console.error('Failed to create article:', error);
      // You could add a notification here
    } finally {
      setIsCreating(false);
    }
  };

  return (
    <Button
      style={{backgroundColor: '#007bff', color: '#fff'}}
      startIcon={isCreating ? <Loader small /> : <Plus />}
      onClick={handleCreateAndEdit}
      disabled={isCreating}
      variant="default"
    >
      {isCreating ? 'Creating...' : 'Create With Live Preview'}
    </Button>
  );
};

export default CustomCreateButton;