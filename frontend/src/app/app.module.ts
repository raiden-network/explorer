import {
  BrowserModule,
  HAMMER_GESTURE_CONFIG,
  HammerGestureConfig
} from '@angular/platform-browser';
import { APP_INITIALIZER, NgModule } from '@angular/core';

import { AppComponent } from './app.component';
import { RouteReuseStrategy, RouterModule, Routes } from '@angular/router';
import { NetMetricsConfig } from './services/net.metrics/net.metrics.config';
import { HTTP_INTERCEPTORS, HttpClientModule } from '@angular/common/http';
import { SharedService } from './services/net.metrics/shared.service';
import { NetMetricsService } from './services/net.metrics/net.metrics.service';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { HomeComponent } from './components/home/home.component';
import { NetMetricsInterceptor } from './services/net.metrics/net.metrics.interceptor';
import { NetworkInformationComponent } from './components/network-information/network-information.component';
import { CommonModule } from '@angular/common';
import { DonutChartComponent } from './components/donut-chart/donut-chart.component';
import { NetworkGraphComponent } from './components/network-graph/network-graph.component';
import { FlexLayoutModule } from '@angular/flex-layout';
import { MatAutocompleteModule } from '@angular/material/autocomplete';
import { MatButtonModule } from '@angular/material/button';
import { MatRippleModule } from '@angular/material/core';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatListModule } from '@angular/material/list';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';
import { MatTooltipModule } from '@angular/material/tooltip';
import { environment } from '../environments/environment';
import { SmallNumberPipe } from './pipes/small-number.pipe';
import { ReactiveFormsModule } from '@angular/forms';
import { OpenChannelListComponent } from './components/open-channel-list/open-channel-list.component';
import { TotalsSectionComponent } from './components/totals-section/totals-section.component';
import { ButtonsSectionComponent } from './components/buttons-section/buttons-section.component';
import { GraphSectionComponent } from './components/graph-section/graph-section.component';
import { ActiveNetworksSectionComponent } from './components/active-networks-section/active-networks-section.component';
import 'hammerjs';
import { ChannelsOverviewComponent } from './components/channels-overview/channels-overview.component';
import { NetworkAveragesComponent } from './components/network-averages/network-averages.component';
import { TotalChannelsByDepositComponent } from './components/total-channels-by-deposit/total-channels-by-deposit.component';
import { TopParticipantsByChannelComponent } from './components/top-participants-by-channel/top-participants-by-channel.component';
import { ExplorerRouteReuseStrategy } from './routing/explorer-route-reuse-strategy';
import { DebounceClickDirective } from './directives/debounce-click.directive';
import { ShortenAddressPipe } from './pipes/shorten-address.pipe';

const appRoutes: Routes = [
  { path: '', redirectTo: '/tokens', pathMatch: 'full' },
  {
    path: 'tokens',
    component: HomeComponent,
    children: [
      {
        path: ':token_address',
        component: NetworkInformationComponent
      }
    ]
  },
  { path: '**', redirectTo: '/tokens', pathMatch: 'full' }
];

export function ConfigFactory(config: NetMetricsConfig) {
  return () => config.load(environment.configurationFile);
}

export class ExplorerHammerConfig extends HammerGestureConfig {
  overrides = <any>{
    pinch: { enable: false },
    rotate: { enable: false }
  };
}

@NgModule({
  declarations: [
    AppComponent,
    HomeComponent,
    NetworkInformationComponent,
    DonutChartComponent,
    NetworkGraphComponent,
    SmallNumberPipe,
    OpenChannelListComponent,
    TotalsSectionComponent,
    ButtonsSectionComponent,
    GraphSectionComponent,
    ActiveNetworksSectionComponent,
    ChannelsOverviewComponent,
    NetworkAveragesComponent,
    TotalChannelsByDepositComponent,
    TopParticipantsByChannelComponent,
    DebounceClickDirective,
    ShortenAddressPipe
  ],
  imports: [
    RouterModule.forRoot(appRoutes),
    FlexLayoutModule,
    MatSlideToggleModule,
    MatButtonModule,
    MatRippleModule,
    MatProgressSpinnerModule,
    MatTooltipModule,
    MatFormFieldModule,
    MatInputModule,
    MatAutocompleteModule,
    MatListModule,
    ReactiveFormsModule,
    BrowserModule,
    CommonModule,
    HttpClientModule,
    BrowserAnimationsModule,
    MatIconModule
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
    {
      provide: HAMMER_GESTURE_CONFIG,
      useClass: ExplorerHammerConfig
    },
    {
      provide: RouteReuseStrategy,
      useClass: ExplorerRouteReuseStrategy
    },
    NetMetricsService
  ],
  bootstrap: [AppComponent]
})
export class AppModule {}
