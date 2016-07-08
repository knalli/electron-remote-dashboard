angular.module('app')
  .controller('DashboardController', function ($rootScope, $mdDialog, $mdMedia, $mdToast, $scope, $sce) {

    var me = this;

    this.states = {
      online: false
    };

    this.webview = {
      loading: false,
      failed: false,
      title: '',
      url: null,
      fullscreen: false
    };

    this.activeDashboard = '';
    this.pendingDashboard = '';
    this.items = [];

    var socket = io(undefined, {
      timeout: 5000
    });
    socket.on('connect', function () {
      $scope.$apply(function () {
        $rootScope.$emit('server-connected');
      });
    });
    socket.on('disconnect', function () {
      $scope.$apply(function () {
        $rootScope.$emit('server-disconnected');
      });
    });
    socket.on('error', function () {
      $scope.$apply(function () {
        $rootScope.$emit('server-disconnected');
      });
    });
    socket.on('reconnect_error', function () {
      $scope.$apply(function () {
        $rootScope.$emit('server-disconnected');
      });
    });
    socket.on('dashboard-changed', function (dashboard) {
      $scope.$apply(function () {
        me.activeDashboard = dashboard.id;
        me.pendingDashboard = dashboard.id;
      });
    });
    socket.on('dashboard-updated', function (dashboard) {
      $scope.$apply(function () {
        for (var i = 0; i < me.items.length; i++) {
          if (me.items[i].id === dashboard.id) {
            me.items[i] = dashboard;
          }
        }
      });
    });
    socket.on('dashboards-updated', function (dashboards) {
      $scope.$apply(function () {
        me.activeDashboard = dashboards.active;
        me.pendingDashboard = dashboards.active;
        me.items = dashboards.items;
      });
    });
    socket.on('states-updated', function (args) {
      $scope.$apply(function () {
        if (typeof args.online !== 'undefined') {
          me.states.online = args.online;
        }
      });
    });
    socket.on('view-updated', function (data) {
      console.log('view updated', data);
      $scope.$apply(function () {
        var webview = me.webview;
        webview.favicon = data.favicon;
        webview.failed = data.statesFailed || (data.lastResponse && data.lastResponse.httpResponseCode >= 400);
        webview.loading = data.statesLoading;
        webview.loadingShow = data.statesLoading === true;
        webview.title = data.title;
        webview.description = $sce.trustAsHtml(data.description);
        webview.url = data.url;
        webview.lastResponse = data.lastResponse;
      });
    });

    $rootScope.$on('server-connected', function () {
      me.states.connected = true;
    });

    $rootScope.$on('server-disconnected', function () {
      me.states.connected = false;
    });

    $rootScope.$on('server-connected', function () {
      socket.emit('list-dashboards', function (dashboards) {
        $scope.$apply(function () {
          me.activeDashboard = dashboards.active;
          me.pendingDashboard = dashboards.active;
          me.items = dashboards.items;
        });
      });
    });

    this.applyActive = function (dashboardId) {
      socket.emit('change-dashboard', dashboardId, function (result) {
        $scope.$apply(function () {
          if (!result.success) {
            me.pendingDashboard = me.activeDashboard;
            $mdDialog.show(
              $mdDialog.alert()
                .title('Failed')
                .textContent(result.message || 'Could not apply the dashboard.')
                .ok('Dismiss')
            );
          } else {
            me.activeDashboard = dashboardId;
            $mdToast.show(
              $mdToast.simple()
                .textContent('Changed.')
                .position('bottom right')
                .hideDelay(2000)
            );

            // hack
            setTimeout(function () {
              var img = document.getElementById('tabPreview');
              img.src = img.src; // reload hack
            }, 2000);
          }
        });
      });
    };

    this.showCreateDashboardDialog = function (ev) {
      var useFullScreen = ($mdMedia('sm') || $mdMedia('xs')) && $scope.customFullscreen;
      $mdDialog.show({
        controller: function ($scope, $mdDialog) {
          $scope.hide = function () {
            $mdDialog.hide();
          };
          $scope.cancel = function () {
            $mdDialog.cancel();
          };
          $scope.answer = function (answer) {
            $mdDialog.hide(answer);
          };
        },
        templateUrl: 'scripts/CreateDashboardDialog.html',
        parent: angular.element(document.body),
        targetEvent: ev,
        clickOutsideToClose: true,
        fullscreen: useFullScreen
      })
        .then(function (dashboard) {
          if (dashboard) {
            me.createDashboard(dashboard);
          }
        }, function () {
          // TODO
        });
    };

    this.showRemoveDashboardDialog = function (ev, dashboardId) {
      var confirm = $mdDialog.confirm()
        .title('Would you like to delete this dashboard?')
        .ariaLabel('Yes')
        .targetEvent(ev)
        .ok('Yes, delete.')
        .cancel('Cancel');
      $mdDialog.show(confirm).then(function () {
        me.removeDashboard(dashboardId);
        $scope.status = 'You decided to get rid of your debt.';
      }, function () {
        // FIXME
      });
    };

    this.createDashboard = function (dashboard) {
      socket.emit('create-dashboard', dashboard, function (result) {
        $scope.$apply(function () {
          if (!result.success) {
            $mdDialog.show(
              $mdDialog.alert()
                .title('Failed')
                .textContent(result.message || 'Could not create the dashboard.')
                .ok('Dismiss')
            );
          } else {
            $mdToast.show(
              $mdToast.simple()
                .textContent('Created.')
                .position('bottom right')
                .hideDelay(2000)
            );
          }
        });
      });
    };

    this.removeDashboard = function (dashboardId) {
      socket.emit('remove-dashboard', dashboardId, function (result) {
        $scope.$apply(function () {
          if (!result.success) {
            $mdDialog.show(
              $mdDialog.alert()
                .title('Failed')
                .textContent(result.message || 'Could not remove the dashboard.')
                .ok('Dismiss')
            );
          } else {
            $mdToast.show(
              $mdToast.simple()
                .textContent('Removed.')
                .position('bottom right')
                .hideDelay(2000)
            );
          }
        });
      });
    };

    this.toggleFullscreen = function () {
      socket.emit('toggle-fullscreen', function (result) {
        $scope.$apply(function () {
          if (!result.success) {
            $mdDialog.show(
              $mdDialog.alert()
                .title('Failed')
                .textContent(result.message || 'Could not switch fullscreen.')
                .ok('Dismiss')
            );
          } else {
            $mdToast.show(
              $mdToast.simple()
                .textContent('switch fullscreen.')
                .position('bottom right')
                .hideDelay(2000)
            );
          }
        });
      });
    };

    this.reload = function () {
      me.applyActive(me.activeDashboard);
    };
  });
