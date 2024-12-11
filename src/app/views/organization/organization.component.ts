import { Component, NgZone, OnInit } from '@angular/core';
import { Router, ActivatedRoute } from '@angular/router';
import { AngularFireAuth } from '@angular/fire/auth';
import { Organization, OrganizationService } from '../../services/organization.service';
import { User, UserService } from '../../services/user.service';

@Component({
  selector: 'app-organization',
  templateUrl: 'organization.component.html'
})
export class OrganizationComponent implements OnInit {

  public msgSaved: string;
  public msgUsrSaved: string;
  public msgUsrError: string;
  public msgNoOrg: string;
  public msgSavedJoin: string;
  public msgErrorJoin: string;
  public msgDivSaved: string;
  public msgDivError: string;

  public name: string;

  public orgs: Organization[];
  public joinOrg: Organization;
  public allOrgs: Organization[];
  public user: User;

  public currentOrg = null;

  return = '';

  constructor(
    private afAuth: AngularFireAuth,
    private organizationService: OrganizationService,
    private userService: UserService,
    private ngZone: NgZone,
    private router: Router
  ) {
    // Load users
    this.afAuth.auth.onAuthStateChanged(user => {
      if (user) {
        this.userService.getUserById(user.uid).subscribe(userDB => {
          if (userDB) {
            this.user = userDB;
            // Load organizations
            this.organizationService.subscribeToOrganizations()
              .subscribe(res => {
                this.allOrgs = res.sort((a, b) => (a.name.trim().toLowerCase() > b.name.trim().toLowerCase()) ? 1 : -1);
                this.filterOrgs();
              });
          }
        });
      }
    });
  }

  ngOnInit() {
  }

  filterOrgs() {
    if (this.user && this.allOrgs) {
      this.orgs = [];
      this.allOrgs.forEach(org => {
        // If current user is included in that Organization, list it.
        if (org.admin.indexOf(this.user._id) > -1 || org.regular.indexOf(this.user._id) > -1) {
          this.orgs.push(org);
        }
      });
      this.setUsersToOrg();
    }
    const newOrg = new Organization();
    newOrg.name = 'Create a new one';
    newOrg._id = 'new';
    this.allOrgs = [newOrg].concat(this.allOrgs);
  }

  setUsersToOrg() {
    this.orgs.forEach(org => {
      if (org.admin) {
        if (!org.adminUser) {
          org.adminUser = [];
        }
        org.admin.forEach(adminId => {
          const userSubAdmin = this.userService.getUserById(adminId).subscribe(adminDB => {
            if (adminDB) {
              org.adminUser.push(adminDB);
            }
            userSubAdmin.unsubscribe();
          });
        });
      }
      if (org.regular) {
        if (!org.regularUser) {
          org.regularUser = [];
        }
        org.regular.forEach(regurlarId => {
          const userSubReg = this.userService.getUserById(regurlarId).subscribe(regularDB => {
            if (regularDB) {
              // tslint:disable-next-line:max-line-length
              org.regularUser.push(regularDB);
            }
            userSubReg.unsubscribe();
          });
        });
      }
      if (org.pending) {
        if (!org.pendingUser) {
          org.pendingUser = [];
        }
        org.pending.forEach(pendingId => {
          const userSubPen = this.userService.getUserById(pendingId).subscribe(pendingDB => {
            if (pendingDB) {
              // tslint:disable-next-line:max-line-length
              org.pendingUser.push(pendingDB);
            }
            userSubPen.unsubscribe();
          });
        });
      }
    });
  }

  save(orgIndex) {
    this.currentOrg = this.orgs[orgIndex];
    this.organizationService.updateOrganizationWithId(this.orgs[orgIndex]._id, this.currentOrg);
    this.msgSaved = 'Saved!';
  }

  delete(orgIndex) {
    this.currentOrg = this.orgs[orgIndex];

    this.deleteUserFromOrg(this.user, this.currentOrg);

    if (this.currentOrg.admin) {
      this.currentOrg.admin.forEach(adminId => {
        const userSubAdmin = this.userService.getUserById(adminId).subscribe(adminDB => {
          if (adminDB) {
            this.deleteUserFromOrg(adminDB, this.currentOrg);
          }
          userSubAdmin.unsubscribe();
        });
      });
    }
    if (this.currentOrg.regular) {
      this.currentOrg.regular.forEach(regularId => {
        const userSubReg = this.userService.getUserById(regularId).subscribe(regularDB => {
          if (regularDB) {
            this.deleteUserFromOrg(regularDB, this.currentOrg);
          }
          userSubReg.unsubscribe();
        });
      });
    }
    if (this.currentOrg.pending) {
      this.currentOrg.pending.forEach(pendingId => {
        const userSubPen = this.userService.getUserById(pendingId).subscribe(pendingDB => {
          if (pendingDB) {
            this.deleteUserFromOrg(pendingDB, this.currentOrg);
          }
          userSubPen.unsubscribe();
        });
      });
    }
    // Remove from organizations collection
    this.organizationService.removeOrganization(this.currentOrg);
  }

  deleteUserFromOrg(user, org) {
    if (user && org && (org.admin.length > 1 || (org.admin.length == 1 && !org.admin.includes(user._id)))) {
      const indexToRemove = user.organizations.indexOf(org._id);
      if (indexToRemove !== -1) {
        user.organizations.splice(indexToRemove, 1);
        this.userService.updateUserWithId(user._id, user);
      }
    } else {
      this.msgUsrSaved = null;
      this.msgUsrError = 'Can not remove the only admin! Remove organization if you prefer.';
    }
  }

  makeRegularUser(orgIndex, userId) {
    this.currentOrg = this.orgs[orgIndex];
    // prevent from changing the last admin user to regular, because the organization will be orphan
    if (this.orgs[orgIndex].admin.length > 1 || this.orgs[orgIndex].admin.length === 1 && this.orgs[orgIndex].admin[0] !== userId) {

      // Remove from admin if toggling permissions
      if (this.orgs[orgIndex].admin.indexOf(userId) > -1) {
        const indexToRemove = this.orgs[orgIndex].admin.indexOf(userId);
        this.orgs[orgIndex].admin.splice(indexToRemove, 1);
      }
      // add to regular users
      this.orgs[orgIndex].regular.push(userId);
      // remove from pending if pending
      if (this.currentOrg.pending && this.currentOrg.pending.indexOf(userId) > -1) {
        const indexToRemovePending = this.currentOrg.pending.indexOf(userId);
        this.currentOrg.pending.splice(indexToRemovePending, 1);

        // add org index to user db
        const userSub = this.userService.getUserById(userId).subscribe(userDB => {
          if (userDB) {
            const u = new User(userDB);
            u.organizations.push(this.currentOrg._id);
            this.userService.updateUserWithId(u._id, u);
          }
          userSub.unsubscribe();
        });
      }
      this.organizationService.updateOrganizationWithId(this.orgs[orgIndex]._id, this.currentOrg);
      this.msgUsrSaved = 'User made regular!';
      this.msgUsrError = null;
    } else {
      this.msgUsrSaved = null;
      this.msgUsrError = 'Can not change the only admin to a regular user! Add other admin first.';
    }
  }

  makeAdminUser(orgIndex, userId) {
    this.currentOrg = this.orgs[orgIndex];
    // remove from regular if toggling permissions
    if (this.currentOrg.regular.indexOf(userId) > -1) {
      const indexToRemove = this.currentOrg.regular.indexOf(userId);
      this.currentOrg.regular.splice(indexToRemove, 1);
    }
    // add to admin users
    this.currentOrg.admin.push(userId);
    // remove from pending if pending
    if (this.currentOrg.pending && this.currentOrg.pending.indexOf(userId) > -1) {
      const indexToRemovePending = this.currentOrg.pending.indexOf(userId);
      this.currentOrg.pending.splice(indexToRemovePending, 1);

      // add org index to user db
      const userSub = this.userService.getUserById(userId).subscribe(userDB => {
        if (userDB) {
          const u = new User(userDB);
          u.organizations.push(this.currentOrg._id);
          this.userService.updateUserWithId(u._id, u);
        }
        userSub.unsubscribe();
      });
    }
    this.organizationService.updateOrganizationWithId(this.orgs[orgIndex]._id, this.currentOrg);
    this.msgUsrSaved = 'User made admin!';
    this.msgUsrError = null;
  }

  addUserToOrg(orgIndex, userEmail) {
    this.currentOrg = this.orgs[orgIndex];

    const userSub = this.userService.getUserByEmail(userEmail).subscribe(users => {
      if (users && users.length === 1) {
        const u = new User(users[0]);
        // Add user id to org regular user
        if (!this.currentOrg.regular) {
          this.currentOrg.regular = [];
        }
        if (this.currentOrg.admin.indexOf(u._id) === -1 && this.currentOrg.regular.indexOf(u._id) === -1) {
          this.currentOrg.regular.push(u._id);
          this.organizationService.updateOrganizationWithId(this.currentOrg._id, this.currentOrg);
          this.msgUsrSaved = 'Added regular user, change permission if needed.';
          this.msgUsrError = null;

          // Add org id to user
          if (!u.organizations) {
            u.organizations = [];
          }
          u.organizations.push(this.currentOrg._id);
          this.userService.updateUserWithId(u._id, u);
        } else {
          this.msgUsrError = 'This user is already a member of this organization.';
          this.msgUsrSaved = null;
        }
      } else {
        this.msgUsrError = 'This user is not registered in the system. Check if the email address is correct.';
        this.msgUsrSaved = null;
      }
      userSub.unsubscribe();
    });
  }

  removeUser(orgIndex, userId, type) {
    this.currentOrg = this.orgs[orgIndex];
    if (type === 'regular') {
      const indexToRemove = this.currentOrg.regular.indexOf(userId);
      this.currentOrg.regular.splice(indexToRemove, 1);
    } else if (type === 'pending') {
      const indexToRemove = this.currentOrg.pending.indexOf(userId);
      this.currentOrg.pending.splice(indexToRemove, 1);
    } else if (type === 'admin') {
      if (this.currentOrg.admin.length > 1) {
        const indexToRemove = this.currentOrg.admin.indexOf(userId);
        this.currentOrg.admin.splice(indexToRemove, 1);
      } else {
        this.msgUsrSaved = null;
        this.msgUsrError = 'Can not remove the only admin! Remove organization if you prefer.';
      }
    }
    // Update joinOrg
    if (this.joinOrg) this.joinOrg = this.currentOrg;
    // Update Firebase Organization
    this.organizationService.updateOrganizationWithId(this.orgs[orgIndex]._id, this.orgs[orgIndex]);
    const userSub = this.userService.getUserById(userId).subscribe(userDB => {
      if (userDB) {
        this.deleteUserFromOrg(userDB, this.currentOrg);
      }
      userSub.unsubscribe();
    });
    this.msgUsrSaved = 'User removed from organization!';
    this.msgUsrError = null;
  }

  newOrg() {
    const newOrganization = new Organization();
    newOrganization.admin = [];
    newOrganization.admin.push(this.user._id);
    const idOrg = this.organizationService.addNewOrganization(newOrganization);
    if (!this.user.organizations) {
      this.user.organizations = [];
    }
    this.user.organizations.push(idOrg);
    this.userService.updateUserWithId(this.user._id, this.user);
  }

  userJoinOrg() {
    // first item on list is 'create a new Org'
    if (this.joinOrg._id === 'new') {
      this.newOrg();
    } else {
      // check if user is already in this organization
      // tslint:disable-next-line:max-line-length
      if (this.joinOrg.admin.indexOf(this.user._id) === -1 && this.joinOrg.regular.indexOf(this.user._id) === -1 && this.joinOrg.pending.indexOf(this.user._id) === -1) {
        // this.joinOrg.pending.push(this.user._id);
        // directly join org as regular user
        this.joinOrg.regular.push(this.user._id);
        this.organizationService.updateOrganizationWithId(this.joinOrg._id, this.joinOrg);

        const userSub = this.userService.getUserById(this.user._id).subscribe(userDB => {
           if (userDB) {
             const u = new User(userDB);
               // Add org id to user
               if (!u.organizations) {
                 u.organizations = [];
               }
               u.organizations.push(this.joinOrg._id);
               this.userService.updateUserWithId(u._id, u);
             }
           userSub.unsubscribe();
         });
         this.msgSavedJoin = 'You were added to the organization.';
        this.msgErrorJoin = null;
      } else {
        this.msgErrorJoin = 'You are already a member of this organization.';
        this.msgSavedJoin = null;
      }
    }
  }

  newDivision(orgIndex, nameDiv) {
    this.currentOrg = this.orgs[orgIndex];
    if (!this.currentOrg.divisions) {
      this.currentOrg.divisions = [];
    }
    this.currentOrg.divisions.push(nameDiv);
    this.organizationService.updateOrganizationWithId(this.currentOrg._id, this.currentOrg);
    this.msgDivSaved = nameDiv + ' division saved';
  }

   removeDivision(orgIndex, nameDiv) {
    this.currentOrg = this.orgs[orgIndex];
    const indexToRemove = this.currentOrg.divisions.indexOf(nameDiv);
    this.currentOrg.divisions.splice(indexToRemove, 1);
    this.organizationService.updateOrganizationWithId(this.currentOrg._id, this.currentOrg);
    this.msgDivSaved = nameDiv + ' division removed';
   }
   
}
