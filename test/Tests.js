const BigNumber = require('bignumber.js');
const Token = artifacts.require('CryptoIndexToken');

async function assertRevert(promise) {
    try {
        await promise;
        assert.fail('Expected revert not received');
    } catch (error) {
        const revertFound = error.message.search('revert') >= 0;
        const invalidOpcodeFound = error.message.search('invalid opcode') >= 0;
        assert(revertFound || invalidOpcodeFound, `Expected "revert" or "invalid opcode", got ${error} instead`);
    }
}

contract('Token', function ([
    _,
    owner,
    forgetFund,
    teamFund,
    advisorsFund,
    bonusFund,
    reserveFund,
    recipient,
    anotherAccount,
]) {
    const ZERO_ADDRESS = '0x0000000000000000000000000000000000000000';
    const TOTAL_SUPPLY = 300000000 * (10 ** 18);
    const forgetFundAmount = TOTAL_SUPPLY * 0.1;
    const bonusFundAmount = TOTAL_SUPPLY * 0.3;

    beforeEach(async function () {
        this.token = await Token.new(
            forgetFund,
            teamFund,
            advisorsFund,
            bonusFund,
            reserveFund,
            {from: owner}
        );
    });

    describe('minting', function() {
        
        describe('when minting is not started', function() {
            it('reverts', async function() {
                const promise = this.token.batchMint([recipient], [100], {from: owner});
                assertRevert(promise);
            });
        });

        describe('when minting is started', function() {
        
            beforeEach(async function() {
                await this.token.startMinting(forgetFundAmount, bonusFundAmount, { from: owner });
            });

            describe('when minting is not finished', function() {
                it('should mint tokens for one address', async function() {
                    await this.token.batchMint([recipient], [100], {from: owner});
                    const balance = await this.token.balanceOf(recipient);
                    assert.equal(balance, 100);
                });

                it('should mint tokens for several addressses', async function() {
                    const recepients = [owner, recipient, anotherAccount];
                    const balances = [100, 200, 300];
                    await this.token.batchMint(recepients, balances, {from: owner});

                    for (let i = 0; i < recepients.length; i++) {
                        const balance = await this.token.balanceOf(recepients[i]);
                        assert.equal(balances[i], balance);
                    }
                });

                it('should not allow to mint more than totalSupply', async function() {
                    assertRevert(this.token.batchMint([recipient], [TOTAL_SUPPLY + 1]));
                });
            });

            describe('when minting is finished', function() {
                it('reverts', async function() {
                    await this.token.finishMinting({from: owner});
                    await assertRevert(this.token.batchMint([recipient], [100], {from: owner}));
                })
            });
        });


        describe('from controllers', function() {
            beforeEach(async function() {
                await this.token.startMinting(forgetFundAmount, bonusFundAmount, { from: owner });
                await this.token.addController(anotherAccount, {from: owner});
            });

            it('should allow to add an controller', async function() {
                const isController = await this.token.controllers(anotherAccount);
                assert.equal(isController, true);
            });

            it('should be able to mint from controller', async function() {
                await this.token.startMinting(forgetFundAmount, bonusFundAmount, { from: owner });
                await this.token.batchMint([owner], [100], {from: anotherAccount});
                const balance = await this.token.balanceOf(owner);
                assert.equal(balance, 100);
            });
        });

        describe('trying to finish minting from another account', function() {
            it('reverts', async function() {
                assertRevert(this.token.finishMinting({from: anotherAccount}));
            })
        });
    })

    describe('total supply', function () {
        it('should have initial total supply of 300.000.000 CIX100', async function () {
            const totalSupply = await this.token.totalSupply();

            assert.equal(totalSupply.toNumber(), 300000000 * (10 ** 18));
        });
    });

    describe('balanceOf', function () {
        describe('when the requested account has no tokens', function () {
            it('returns zero', async function () {
                const balance = await this.token.balanceOf(anotherAccount);

                assert.equal(balance, 0);
            });
        });

        describe('when has some tokens', function() {
            it('is not zero', async function() {
                await this.token.startMinting(forgetFundAmount, bonusFundAmount, { from: owner });
                await this.token.batchMint([recipient], [100], {from: owner});

                const balance = await this.token.balanceOf(recipient);

                assert.equal(balance, 100);
            })
        })
    });

    describe('finishing minting', function() {
        describe('when minting is started', function() {
            const recipients = [ owner, recipient, anotherAccount ];
            const amounts = [500, 500, 500];
            const sumOfPrivateSale = amounts.reduce((a, v) => a + v);
            const advisorsFundPart = (sumOfPrivateSale + forgetFundAmount) * 0.03;
            const teamFundPart = (sumOfPrivateSale + forgetFundAmount) * 0.07;
            const reserveFundAmount = TOTAL_SUPPLY - advisorsFundPart - teamFundPart - sumOfPrivateSale - forgetFundAmount - bonusFundAmount;

            beforeEach('send tokens to private sale accounts', async function() {
                await this.token.startMinting(forgetFundAmount, bonusFundAmount, { from: owner });
                await this.token.batchMint(recipients, amounts, { from: owner });
                await this.token.finishMinting({ from: owner });
            });

            it('should have correct balances for all accounts', async function() {
                for (let i = 0; i < recipients.length; i++) {
                    assert.equal((await this.token.balanceOf(recipients[i])).toNumber(), amounts[i]);
                }
                assert.equal(await this.token.balanceOf(forgetFund), forgetFundAmount);
                assert.equal(await this.token.balanceOf(bonusFund), bonusFundAmount);
                assert.equal(await this.token.balanceOf(advisorsFund), advisorsFundPart);
                assert.equal(await this.token.balanceOf(teamFund), teamFundPart);
                assert.equal(await this.token.balanceOf(reserveFund), reserveFundAmount);
            });
        });

        describe('when minting is not yet started', function() {
            it('should revert', function() {
                assertRevert(this.token.finishMinting({ from: owner }));
            });
        });
    });

    describe('transfer', function () {
        describe('when token is transferable', function() {

            beforeEach('mint tokens and make token transferable', async function() {
                await this.token.startMinting(forgetFundAmount, bonusFundAmount, { from: owner });
                await this.token.batchMint([owner], [100], {from: owner});
                await this.token.finishMinting({from: owner});
            })
            
            describe('when the recipient is not the zero address', function () {
                const to = recipient;

                describe('when the sender does not have enough balance', function () {
                    const amount = 101;

                    it('reverts', async function () {
                        await assertRevert(this.token.transfer(to, amount, { from: owner }));
                    });
                });

                describe('when the sender has enough balance', function () {
                    const amount = 100;

                    it('transfers the requested amount', async function () {
                        await this.token.transfer(to, amount, { from: owner });

                        const senderBalance = await this.token.balanceOf(owner);
                        assert.equal(senderBalance, 0);

                        const recipientBalance = await this.token.balanceOf(to);
                        assert.equal(recipientBalance, amount);
                    });
                });
            });

            describe('when the recipient is the zero address', function () {
                const to = ZERO_ADDRESS;

                it('reverts', async function () {
                    await assertRevert(this.token.transfer(to, 100, { from: owner }));
                });
            });
        });

        describe('when token is untransferable', function() {
            const to = recipient

            it('reverts', async function () {
                await this.token.startMinting(forgetFundAmount, bonusFundAmount, { from: owner });
                await this.token.batchMint([owner], [100], {from: owner});
                await assertRevert(this.token.transfer(to, 100, { from: owner }));
            }); 
        })
    });

    describe('approve', function () {
        beforeEach('mint tokens and make them transferable', async function() {
                await this.token.startMinting(forgetFundAmount, bonusFundAmount, { from: owner });
                await this.token.batchMint([owner], [100], {from: owner});
                await this.token.finishMinting({from: owner});  
        });

        describe('when the spender is not the zero address', function () {
            const spender = recipient;

            describe('when the sender has enough balance', function () {
                const amount = 100;

                describe('when there was no approved amount before', function () {
                    it('approves the requested amount', async function () {
                        await this.token.approve(spender, amount, { from: owner });

                        const allowance = await this.token.allowance(owner, spender);
                        assert.equal(allowance, amount);
                    });
                });

                describe('when the spender had an approved amount', function () {
                    it('reverts', async function () {
                        await this.token.approve(spender, 2, { from: owner });

                        await assertRevert(this.token.approve(spender, 2, {from: owner}));
                    });
                });
            });

            describe('when the sender does not have enough balance', function () {
                const amount = 101;
                
                describe('when there was no approved amount before', function () {
                    it('approves the requested amount', async function () {
                        await this.token.approve(spender, amount, { from: owner });

                        const allowance = await this.token.allowance(owner, spender);
                        assert.equal(allowance, amount);
                    });
                });
            });
        });

        describe('when the spender is the zero address', function () {
            const amount = 100;
            const spender = ZERO_ADDRESS;

            it('approves the requested amount', async function () {
                await this.token.approve(spender, amount, { from: owner });

                const allowance = await this.token.allowance(owner, spender);
                assert.equal(allowance, amount);
            });
        });
    });

    describe('transfer from', function () {
        const spender = recipient;

        describe('when the recipient is not the zero address', function () {
            const to = anotherAccount;

            describe('when the spender has enough approved balance', function () {
                beforeEach(async function () {
                    await this.token.startMinting(forgetFundAmount, bonusFundAmount, { from: owner });
                    await this.token.batchMint([owner], [100], {from: owner});
                    await this.token.finishMinting({from: owner});
                    await this.token.approve(spender, 100, { from: owner });
                });

                describe('when the owner has enough balance', function () {
                    const amount = 100;

                    it('transfers the requested amount', async function () {
                        await this.token.transferFrom(owner, to, amount, { from: spender });

                        const senderBalance = await this.token.balanceOf(owner);
                        assert.equal(senderBalance, 0);

                        const recipientBalance = await this.token.balanceOf(to);
                        assert.equal(recipientBalance, amount);
                    });

                    it('decreases the spender allowance', async function () {
                        await this.token.transferFrom(owner, to, amount, { from: spender });

                        const allowance = await this.token.allowance(owner, spender);
                        assert(allowance.eq(0));
                    });
                });

                describe('when the owner does not have enough balance', function () {
                    const amount = 101;

                    it('reverts', async function () {
                        await assertRevert(this.token.transferFrom(owner, to, amount, { from: spender }));
                    });
                });
            });

            describe('when the spender does not have enough approved balance', function () {
                beforeEach(async function () {
                    await this.token.approve(spender, 99, { from: owner });
                });

                describe('when the owner has enough balance', function () {
                    const amount = 100;

                    it('reverts', async function () {
                        await assertRevert(this.token.transferFrom(owner, to, amount, { from: spender }));
                    });
                });

                describe('when the owner does not have enough balance', function () {
                    const amount = 101;

                    it('reverts', async function () {
                        await assertRevert(this.token.transferFrom(owner, to, amount, { from: spender }));
                    });
                });
            });
        });

        describe('when the recipient is the zero address', function () {
            const amount = 100;
            const to = ZERO_ADDRESS;

            beforeEach(async function () {
                await this.token.approve(spender, amount, { from: owner });
            });

            it('reverts', async function () {
                await assertRevert(this.token.transferFrom(owner, to, amount, { from: spender }));
            });
        });
    });

    describe('burning', function() {
        beforeEach(async function() {
            await this.token.startMinting(forgetFundAmount, bonusFundAmount, { from: owner });
            await this.token.batchMint([anotherAccount], [100], {from: owner});
        });
        
        describe('when minting is finished', function() {
            it('should not be able to burn tokens', async function() {
                await this.token.finishMinting({from: owner});
                assertRevert(this.token.burn(anotherAccount, 100, {from: owner}));
            })
        });
        
        describe('when minting is not finished', function() {
            it('should be able to burn tokens', async function() {
                await this.token.burn(anotherAccount, 100, {from: owner});
                const balance = await this.token.balanceOf(anotherAccount);
                assert.equal(balance, 0);
            })
        });
    });
});
