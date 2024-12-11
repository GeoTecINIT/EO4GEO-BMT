import { Component, OnDestroy, Inject, NgZone } from '@angular/core';
import { DOCUMENT } from '@angular/common';
import { navItems } from '../../_nav';
import { AngularFireAuth } from '@angular/fire/auth';
import { Router } from '@angular/router';
import { User, UserService } from '../../services/user.service';
import { OrganizationService } from '../../services/organization.service';
import {LoginComponent} from '../../views/login/login.component';
import {BsModalRef, BsModalService} from 'ngx-bootstrap/modal';

@Component({
  selector: 'app-dashboard',
  templateUrl: './default-layout.component.html'
})
export class DefaultLayoutComponent implements OnDestroy {
  public navItems = navItems;
  public sidebarMinimized = true;
  private changes: MutationObserver;
  public element: HTMLElement;
  public username: string;
  isAnonymous = true;
  userId = '';
  hasOrgs = true;
  numPending = 0;
  modalRef: BsModalRef;

  constructor(
    private afAuth: AngularFireAuth,
    private ngZone: NgZone,
    private router: Router,
    private organizationService: OrganizationService,
    private userService: UserService,
    private modalService: BsModalService,
    @Inject(DOCUMENT) _document?: any) {

    this.changes = new MutationObserver((mutations) => {
      this.sidebarMinimized = _document.body.classList.contains('sidebar-minimized');
    });
    this.element = _document.body;
    this.changes.observe(<Element>this.element, {
      attributes: true,
      attributeFilter: ['class']
    });

    this.afAuth.auth.onAuthStateChanged(user => {
      if (user) {
        // User is signed in.
        this.username = user.email;
        this.userId = user.uid;
        this.refreshPending();
      } else {
        this.isAnonymous = true;
      }
    });
  }

  refreshPending() {
    if (this.afAuth.auth.currentUser) {
      this.isAnonymous = this.afAuth.auth.currentUser.isAnonymous;
      this.userService.getUserById(this.afAuth.auth.currentUser.uid).subscribe(userDB => {
        this.hasOrgs = userDB && userDB.organizations && userDB.organizations.length > 0;
        if (userDB == null || Object.keys(userDB).length === 0) {
          this.userService.addNewUser(this.afAuth.auth.currentUser);
        } else if (this.hasOrgs) {
          this.numPending = 0;
          userDB.organizations.forEach(orgId => {
            const orgSubs = this.organizationService.getOrganizationById(orgId).subscribe(org => {
              if (org && org.admin.indexOf(this.userId) > -1) {
                this.numPending = org.pending ? this.numPending + org.pending.length : this.numPending;
              }
              orgSubs.unsubscribe();
            });
          });
        }
      });
    }
  }

  ngOnDestroy(): void {
    this.changes.disconnect();
  }

  logOut() {
    this.afAuth.auth.signOut();
    this.router.routeReuseStrategy.shouldReuseRoute = function () {
      return false;
    };
  }
  openModal() {
    this.modalRef = this.modalService.show(LoginComponent, {class: 'modal-lg'});
  }
}
