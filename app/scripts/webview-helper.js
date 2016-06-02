{
  const onLoad = () => {
    const ipcRenderer = require('electron').ipcRenderer;

    const webview = document.getElementById('webview');

    const getWebviewData = (error = {}) => {
      return {
        url : webview.getURL(),
        title : webview.getTitle(),
        statesLoading : webview.isLoading(),
        statesCrashed : webview.isCrashed(),
        statesWaitingForResponse : webview.isWaitingForResponse(),
        statesFailed : error.errorCode ? true : false,
        errorDescription : error.errorDescription,
      };
    };

    webview.addEventListener('did-finish-load', () => {
      const data = getWebviewData();
      ipcRenderer.send('webview-refreshed', data);
    });
    webview.addEventListener('did-start-loading', () => {
      const data = getWebviewData();
      ipcRenderer.send('webview-refreshed', data);
    });
    webview.addEventListener('did-stop-loading', () => {
      const data = getWebviewData();
      ipcRenderer.send('webview-refreshed', data);
    });
    webview.addEventListener('page-title-updated', () => {
      const data = getWebviewData();
      ipcRenderer.send('webview-refreshed', data);
    });
    webview.addEventListener('did-fail-load', (error) => {
      const data = getWebviewData(error);
      ipcRenderer.send('webview-refreshed', data);
    });
    webview.addEventListener('page-favicon-updated', (favicons) => {
      ipcRenderer.send('webview-favicons-refreshed', favicons);
    });
    webview.addEventListener('did-get-response-details', (response) => {
      if (response.resourceType === 'mainFrame') {
        ipcRenderer.send('webview-response-refreshed', response);
      }
    });

  };

  onLoad();
}
