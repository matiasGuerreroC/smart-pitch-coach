import { ComponentFixture, TestBed } from '@angular/core/testing';
import { RecorderPage } from './recorder.page';

describe('RecorderPage', () => {
  let component: RecorderPage;
  let fixture: ComponentFixture<RecorderPage>;

  beforeEach(() => {
    fixture = TestBed.createComponent(RecorderPage);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
