describe('MainCtrl: ', function() {
  var $rootScope,
      $scope,
      $controller,
      utils,
      board,
      firebaseService,
      auth

  beforeEach(angular.mock.module('fireideaz'));

  beforeEach(inject(function($injector){
    $rootScope = $injector.get('$rootScope');
    $scope = $rootScope.$new();
    $controller = $injector.get('$controller');
    utils = $injector.get('Utils');
    firebaseService = $injector.get('FirebaseService');
    auth = $injector.get('Auth');

    $scope.userId = 'userId';

    $controller('MainCtrl', {
      '$scope': $scope,
      'utils': utils,
      'firebaseService': firebaseService,
      'auth': auth
    });
  }));

  it('should set true to board when user sees notification', function() {
    sinon.spy(localStorage, 'setItem');

    $scope.seeNotification();

    expect(localStorage.setItem.calledWith('funretro1', true)).to.be.true;

    localStorage.setItem.restore();
  });

  it('should retrurn true if user hasn\'t seen the notification before', function() {
    sinon.stub(localStorage, 'getItem', function () { return false; });
    $scope.userId = 'userId';

    var shouldShowNotification = $scope.showNotification();

    expect(shouldShowNotification).to.be.true;

    localStorage.getItem.restore();
  });

  it('should retrurn false if user has already seen the notification', function() {
    sinon.stub(localStorage, 'getItem', function () { return true; });
    $scope.userId = 'userId';

    var shouldShowNotification = $scope.showNotification();

    expect(shouldShowNotification).to.be.false;

    localStorage.getItem.restore();
  });

  it('should open dialog to merge cards when drop an card over another card', function () {
    sinon.spy(utils, 'openDialogMergeCards');

    $scope.droppedEvent("<div class='element1'></div>", "<div class='element2'></div>");

    expect(utils.openDialogMergeCards.calledWith($scope)).to.be.true;
  });

  it('should not open dialog to merge cards when drop an card over the same card', function () {
    sinon.spy(utils, 'openDialogMergeCards');

    $scope.droppedEvent("<div class='element1'></div>", "<div class='element1'></div>");

    expect(utils.openDialogMergeCards.calledWith($scope)).to.be.false;
  });

  describe('Board', function () {

    it('should return true when sort board order by votes', function() {
      $scope.sortField = 'votes';

      expect($scope.getSortOrder()).to.be.true;
    });

    it('should return false when sort board order is not by votes', function() {
      $scope.sortField = 'something else';

      expect($scope.getSortOrder()).to.be.false;
    });

    it('should strip spaces from board names', function() {
      $scope.newBoard.name = 'new name';

      $scope.boardNameChanged();

      expect($scope.newBoard.name).to.equal('newname');
    });

    it('should change the board context', function() {
      var updateSpy = sinon.spy();

      $scope.boardRef = {
        update: updateSpy
      }

      $scope.changeBoardContext();

      expect(updateSpy.called).to.be.true;
    });

    it('should create a new board', function () {
      sinon.stub(utils, 'createUserId', function () { return 'userId'; });
      var createUserSpy = sinon.spy(auth, 'createUserAndLog');

      $scope.createNewBoard();

      expect(createUserSpy.calledWith($scope.userId)).to.be.true;
    });

  });

  describe('Messages', function () {

    it('should delete a message', function() {
      closeAllSpy = sinon.spy(utils, 'closeAll');
      var removeSpy = sinon.spy();

      var message = {
        text: 'text of message',
        user_id: '139021'
      }

      $scope.messages = {
        $remove: removeSpy
      }

      $scope.deleteMessage(message);

      expect(utils.closeAll.called).to.be.true;
      expect(removeSpy.calledWith(message)).to.be.true;
    });

    it('should add a new message', function() {
      closeAllSpy = sinon.spy(utils, 'closeAll');
      sinon.stub(firebaseService, 'getServerTimestamp', function() { return '00:00:00' });

      var addMessagePromise = { then: sinon.spy() };
      var addStub = sinon.stub().returns(addMessagePromise);

      var message = {
        text: 'text of message',
        user_id: '139021'
      }

      $scope.messages = {
        $add: addStub
      }

      $scope.addNewMessage({id: 1});

      expect(addStub.called).to.be.true;
    });

    it('should add a vote to a message when user didn\'t vote on this message before', function() {
      sinon.spy(localStorage, 'setItem');
      sinon.stub(localStorage, 'getItem', function() { return false; });

      $scope.toggleVote('key', 0);

      expect(localStorage.setItem.called).to.be.true;

      localStorage.getItem.restore();
    });

    it('should subtract a vote to a message when user already voted on this message before', function() {
      sinon.spy(localStorage, 'removeItem');
      sinon.stub(localStorage, 'getItem', function() { return true; });

      $scope.toggleVote('key', 0);

      expect(localStorage.removeItem.called).to.be.true;
    });
  });

  describe('Columns', function() {
    var setSpy,
        boardColumns,
        expectedColumns,
        closeAllSpy;

    beforeEach(function() {
      closeAllSpy = sinon.spy(utils, 'closeAll');

      setSpy = sinon.spy();

      boardColumns = {
        set: setSpy
      }

      sinon.stub(utils, 'toObject', function () {
        return { column: 'column' };
      });

      $scope.board = {
        columns: [
          {
            value: 'columnName',
            id: 1
          }
        ]
      }

      sinon.stub(firebaseService, 'getBoardColumns', function () {
        return boardColumns;
      });
    });

    it('should add a new column to the board', function() {
      expectedColumns = [
        {
          value: 'columnName',
          id: 1
        },
        {
          value: 'otherColumnName',
          id: 2
        }
      ]

      sinon.stub(utils, 'getNextId', function () { return 2; });

      $scope.addNewColumn('otherColumnName');

      expect($scope.board.columns).to.deep.equal(expectedColumns);
      expect(setSpy.called).to.be.true;
      expect(closeAllSpy.called).to.be.true;
    });

    it('should change column name', function() {
      $scope.changeColumnName(1, 'new name!');

      expect($scope.board.columns[0].value).to.equal('new name!');
      expect(setSpy.called).to.be.true;
      expect(closeAllSpy.called).to.be.true;
    });

    it('should delete last column of the board', function() {
      $scope.deleteLastColumn();

      expect($scope.board.columns).to.deep.equal([]);
      expect(setSpy.called).to.be.true;
      expect(closeAllSpy.called).to.be.true;
    });
  });
});
