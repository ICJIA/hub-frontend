import { PreviewButton } from '../extensions/components/PreviewButton';
import CustomCreateButton from '../extensions/components/CustomCreateButton';
import CustomEditorModal from '../extensions/components/CustomEditorModal';

export default {
  bootstrap(app: any) {
    const contentManagerPlugin = app.getPlugin('content-manager');
    contentManagerPlugin.injectComponent('listView', 'actions', {
      name: 'custom-create-button',
      Component: CustomCreateButton,
    });
    app.getPlugin('content-manager').injectComponent('editView', 'right-links', {
      name: 'preview-button',
      Component: PreviewButton,
    });
    contentManagerPlugin.injectComponent('listView', 'actions', {
      name: 'custom-editor-modal',
      Component: CustomEditorModal,
    });
  },
};