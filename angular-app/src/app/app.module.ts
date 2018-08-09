import { BrowserModule } from '@angular/platform-browser';
import {APP_INITIALIZER, NgModule} from '@angular/core';

import { AppComponent } from './app.component';
import {RouterModule, Routes} from '@angular/router';
import {NetMetricsConfig} from './services/net.metrics/net.metrics.config';
import {HTTP_INTERCEPTORS, HttpClientModule} from '@angular/common/http';
import {
  AccordionModule, ButtonModule, CarouselModule,
  ConfirmationService, ConfirmDialogModule, DataListModule, DataTableModule,
  DialogModule, DropdownModule,
  GrowlModule, MenuModule,
  MessagesModule, RadioButtonModule, SharedModule,
  SplitButtonModule,
  TabViewModule, TooltipModule
} from 'primeng/primeng';
import {SharedService} from './services/net.metrics/shared.service';
import {NetMetricsService} from './services/net.metrics/net.metrics.service';
import {FormsModule, ReactiveFormsModule} from '@angular/forms';
import {NoopAnimationsModule} from '@angular/platform-browser/animations';
import {HomeComponent} from './components/home/home.component';
import {NetMetricsInterceptor} from './services/net.metrics/net.metrics.interceptor';
import {environment} from '../environments/environment';
import {GraphComponent} from './components/visuals/graph/graph.component';
import {D3_DIRECTIVES} from './services/d3/directives';
import {D3Service} from './services/d3';
import {SHARED_VISUALS} from './components/visuals/shared';

const appRoutes: Routes = [
  {path: '', redirectTo: '/home', pathMatch: 'full'},
  {path: 'home', component: HomeComponent}
];

export function ConfigLoader(nmConfig: NetMetricsConfig) {
  return () => nmConfig.load(environment.configFile);
}

@NgModule({
  declarations: [
    AppComponent,
    HomeComponent,
    GraphComponent,
    ...SHARED_VISUALS,
    ...D3_DIRECTIVES
  ],
  imports: [
    RouterModule.forRoot(appRoutes),
    BrowserModule,
    FormsModule,
    ReactiveFormsModule,
    HttpClientModule,
    DataTableModule,
    SharedModule,
    DataListModule,
    CarouselModule,
    ButtonModule,
    AccordionModule,
    GrowlModule,
    DialogModule,
    SplitButtonModule,
    TabViewModule,
    DropdownModule,
    MessagesModule,
    MenuModule,
    TooltipModule,
    RadioButtonModule,
    ConfirmDialogModule,
    NoopAnimationsModule
  ],
  providers: [
    SharedService,
    {
      provide: HTTP_INTERCEPTORS,
      useClass: NetMetricsInterceptor,
      deps: [SharedService],
      multi: true
    },
    NetMetricsConfig,
    {
      provide: APP_INITIALIZER,
      useFactory: ConfigLoader,
      deps: [NetMetricsConfig],
      multi: true
    },
    NetMetricsService,
    ConfirmationService,
    D3Service
  ],
  bootstrap: [AppComponent]
})
export class AppModule { }
