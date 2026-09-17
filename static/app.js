// 계획은 서버에 저장합니다. sessionStorage는 일회성 저장 알림에만 사용합니다.
document.querySelectorAll('[data-execution-form]').forEach((form) => {
  form.addEventListener('submit', () => {
    const button = form.querySelector('button[type="submit"]');
    button.disabled = true;
    button.textContent = '저장 중…';
    form.querySelector('.save-status').textContent = '실행 기록을 저장하고 있습니다.';
  });
});
window.addEventListener('pageshow', () => {
  document.querySelectorAll('[data-execution-form]').forEach((form) => {
    const button = form.querySelector('button[type="submit"]');
    button.disabled = false;
    button.textContent = '실행 기록 저장';
  });
});
const successNotice = document.querySelector('[data-save-result]');
try {
  if (successNotice && sessionStorage.getItem('pds-save-notice') === location.pathname) {
    successNotice.hidden = false;
    sessionStorage.removeItem('pds-save-notice');
  }
} catch { /* 알림 저장소를 사용할 수 없어도 계획 저장은 가능합니다. */ }

document.querySelectorAll('[data-plan-form]').forEach((form) => {
  const button = form.querySelector('button[type="submit"]');
  const status = form.querySelector('.save-status');
  const errors = document.querySelector('#form-errors');
  const label = button.textContent;
  let saving = false;

  function showErrors(messages) {
    const list = errors.querySelector('ul');
    list.replaceChildren();
    messages.forEach((message) => {
      const item = document.createElement('li');
      item.textContent = message;
      list.append(item);
    });
    errors.hidden = false;
    errors.focus();
    errors.scrollIntoView({ block: 'center' });
  }

  form.addEventListener('submit', async (event) => {
    event.preventDefault();
    if (saving) return;
    saving = true;
    button.disabled = true;
    button.textContent = '저장 중…';
    form.setAttribute('aria-busy', 'true');
    errors.hidden = true;
    status.textContent = '계획을 저장하고 있습니다. 잠시 기다려 주세요.';
    let navigating = false;
    try {
      const response = await fetch(form.action || location.href, {
        method: 'POST', body: new FormData(form), credentials: 'same-origin'
      });
      if (response.ok && response.redirected) {
        status.textContent = '저장했습니다. 상세 화면으로 이동합니다.';
        try { sessionStorage.setItem('pds-save-notice', new URL(response.url).pathname); } catch {}
        navigating = true;
        location.assign(response.url);
        return;
      }
      const page = new DOMParser().parseFromString(await response.text(), 'text/html');
      const messages = [...page.querySelectorAll('#form-errors li')].map((item) => item.textContent);
      showErrors(messages.length ? messages : ['저장 결과를 확인하지 못했습니다. 계획 목록을 먼저 확인해 주세요.']);
      status.textContent = messages.length ? '저장되지 않았습니다. 위 안내를 확인해 주세요.' : '저장 여부를 확인해 주세요.';
    } catch {
      showErrors(['서버와 연결되지 않아 저장 결과를 확인하지 못했습니다. 입력 내용은 이 화면에 남아 있습니다. 다시 저장하기 전에 계획 목록을 확인해 주세요.']);
      status.textContent = '연결 오류 · 저장 여부를 확인해 주세요.';
    } finally {
      if (!navigating) {
        saving = false;
        button.disabled = false;
        button.textContent = label;
        form.removeAttribute('aria-busy');
      }
    }
  });
});
