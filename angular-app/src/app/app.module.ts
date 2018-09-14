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
import { GraphComponent } from './components/visuals/graph/graph.component';
import { D3_DIRECTIVES } from './services/d3/directives';
import { D3Service } from './services/d3';
import { SHARED_VISUALS } from './components/visuals/shared';
import { NetworkInformationComponent } from './components/network-information/network-information.component';
import { CarouselComponent, CarouselItemElementDirective } from './components/carousel/carousel.component';
import { CarouselItemDirective } from './directives/carousel-item.directive';
import { CommonModule } from '@angular/common';
import { DonutChartComponent } from './components/donut-chart/donut-chart.component';

const appRoutes: Routes = [
  {path: '', redirectTo: '/home', pathMatch: 'full'},
  {path: 'home', component: HomeComponent}
];

@NgModule({
  declarations: [
    AppComponent,
    HomeComponent,
    GraphComponent,
    ...SHARED_VISUALS,
    ...D3_DIRECTIVES,
    NetworkInformationComponent,
    CarouselComponent,
    CarouselItemDirective,
    CarouselItemElementDirective,
    DonutChartComponent
  ],
  imports: [
    RouterModule.forRoot(appRoutes),
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
      useFactory: f => {
        return () => {
        };
      },
      deps: [NetMetricsConfig],
      multi: true
    },
    NetMetricsService,
    D3Service
  ],
  bootstrap: [AppComponent]
})
export class AppModule {
}
