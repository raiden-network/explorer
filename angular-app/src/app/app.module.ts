import { BrowserModule } from '@angular/platform-browser';
import { APP_INITIALIZER, NgModule } from '@angular/core';

import { AppComponent } from './app.component';
import { RouterModule, Routes } from '@angular/router';
import { NetMetricsConfig } from './services/net.metrics/net.metrics.config';
import { HTTP_INTERCEPTORS, HttpClientModule } from '@angular/common/http';
import { SharedService } from './services/net.metrics/shared.service';
import { NetMetricsService } from './services/net.metrics/net.metrics.service';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { HomeComponent } from './components/home/home.component';
import { NetMetricsInterceptor } from './services/net.metrics/net.metrics.interceptor';
import { NetworkInformationComponent } from './components/network-information/network-information.component';
import { CarouselComponent, CarouselItemElementDirective } from './components/carousel/carousel.component';
import { CarouselItemDirective } from './directives/carousel-item.directive';
import { CommonModule } from '@angular/common';
import { DonutChartComponent } from './components/donut-chart/donut-chart.component';
import { NetworkGraphComponent } from './components/network-graph/network-graph.component';
import { FlexLayoutModule } from '@angular/flex-layout';
import { MatButtonModule, MatProgressSpinnerModule, MatRippleModule, MatTooltipModule } from '@angular/material';
import { environment } from '../environments/environment';

const appRoutes: Routes = [
  {path: '', redirectTo: '/home', pathMatch: 'full'},
  {path: 'home', component: HomeComponent}
];

export function ConfigFactory(config: NetMetricsConfig) {
  return () => config.load(environment.configurationFile);
}

@NgModule({
  declarations: [
    AppComponent,
    HomeComponent,
    NetworkInformationComponent,
    CarouselComponent,
    CarouselItemDirective,
    CarouselItemElementDirective,
    DonutChartComponent,
    NetworkGraphComponent
  ],
  imports: [
    RouterModule.forRoot(appRoutes),
    FlexLayoutModule,
    MatButtonModule,
    MatRippleModule,
    MatProgressSpinnerModule,
    MatTooltipModule,
    BrowserModule,
    CommonModule,
    HttpClientModule,
    BrowserAnimationsModule
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
      useFactory: ConfigFactory,
      deps: [NetMetricsConfig],
      multi: true
    },
    NetMetricsService
  ],
  bootstrap: [AppComponent]
})
export class AppModule {
}
