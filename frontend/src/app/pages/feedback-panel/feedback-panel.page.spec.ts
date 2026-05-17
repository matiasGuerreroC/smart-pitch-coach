import { ComponentFixture, TestBed } from '@angular/core/testing';
import { FeedbackPanelPage } from './feedback-panel.page';

describe('FeedbackPanelPage', () => {
  let component: FeedbackPanelPage;
  let fixture: ComponentFixture<FeedbackPanelPage>;

  beforeEach(() => {
    fixture = TestBed.createComponent(FeedbackPanelPage);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
