const vscode = acquireVsCodeApi();
const previousState = vscode.getState();
let previousRoutes = previousState ? previousState.routes : '<tr></tr>';
let previousInputText = previousState ? previousState.inputText : '';

const search = document.getElementById('search');
search.focus();
search.value = previousInputText;
search.addEventListener('keyup', () => {
  vscode.postMessage({
    command: 'search',
    text: search.value
  });
});

const allRoutes = document.getElementById('allRoutes');
allRoutes.innerHTML = previousRoutes;

window.addEventListener('message', event => {
  const inputText = search.value;
  const routes = event.data.routes;
  allRoutes.innerHTML = routes;
  vscode.setState({ routes, inputText });
});

function showTextDocument(filePath, action) {
  vscode.postMessage({
    command: 'showTextDocument',
    filePath: filePath,
    action: action
  });
}
