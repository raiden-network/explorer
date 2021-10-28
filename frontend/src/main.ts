import { enableProdMode } from '@angular/core';
import { platformBrowserDynamic } from '@angular/platform-browser-dynamic';

import { AppModule } from './app/app.module';
import { environment } from './environments/environment';

if (environment.production) {
  enableProdMode();
}

(async () => {
  const response = await fetch(environment.configurationFile);
  const config = await response.json();

  environment['config'] = config;

  platformBrowserDynamic()
    .bootstrapModule(AppModule)
    .catch(err => console.error(err));
})();
