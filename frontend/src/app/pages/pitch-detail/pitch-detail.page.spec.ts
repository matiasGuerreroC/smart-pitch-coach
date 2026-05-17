import { ComponentFixture, TestBed } from '@angular/core/testing';
import { PitchDetailPage } from './pitch-detail.page';

describe('PitchDetailPage', () => {
  let component: PitchDetailPage;
  let fixture: ComponentFixture<PitchDetailPage>;

  beforeEach(() => {
    fixture = TestBed.createComponent(PitchDetailPage);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
